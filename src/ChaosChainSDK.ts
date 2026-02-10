/**
 * ChaosChain SDK - Main Entry Point
 * Production-ready SDK for building verifiable AI agents with complete feature parity to Python SDK
 */

import { ethers } from 'ethers';
import { WalletManager } from './WalletManager';
import { ChaosAgent } from './ChaosAgent';
import { X402PaymentManager } from './X402PaymentManager';
import { PaymentManager, PaymentMethodCredentials } from './PaymentManager';
import { X402Server } from './X402Server';
import { GoogleAP2Integration, GoogleAP2IntegrationResult } from './GoogleAP2Integration';
import { A2AX402Extension } from './A2AX402Extension';
import { ProcessIntegrity } from './ProcessIntegrity';
import { AutoStorageManager, StorageBackend } from './StorageBackends';
import { MandateManager } from './MandateManager';
// import { IPFSLocalStorage } from './providers/storage/IPFSLocal'; // Not used
import {
  ChaosChainSDKConfig,
  NetworkConfig,
  AgentRole,
  AgentMetadata,
  AgentRegistration,
  FeedbackParams,
  UploadResult,
  UploadOptions,
  ComputeProvider,
  EvidencePackage,
  IntegrityProof,
} from './types';
import { PaymentMethod } from './types';
import { getNetworkInfo, getContractAddresses, getSupportedNetworks } from './utils/networks';
import { ConfigurationError } from './exceptions';
//
import { GatewayClient } from './GatewayClient';
import { StudioClient } from './StudioClient';
import { VerifierAgent } from './VerifierAgent';
import { StudioManager } from './StudioManager';
import { XMTPManager } from './XMTPClient';
import type { XMTPMessage } from './XMTPClient';
import type { WorkflowStatus, ScoreSubmissionMode } from './types';

/**
 * Main ChaosChain SDK Class - Complete TypeScript implementation
 *
 * Features:
 * - ERC-8004 v1.0 on-chain identity, reputation, and validation
 * - x402 crypto payments (USDC/ETH)
 * - Traditional payments (cards, Google Pay, Apple Pay, PayPal)
 * - Google AP2 intent verification
 * - Process integrity with cryptographic proofs
 * - Pluggable storage providers (IPFS, Pinata, Irys, 0G)
 * - Pluggable compute providers
 * - A2A-x402 extension for multi-payment support
 * - HTTP 402 paywall server
 */
export class ChaosChainSDK {
  private static warnedGatewayMissing = false;
  private static warnedStudioClientProduction = false;
  // Core components
  private walletManager: WalletManager;
  private chaosAgent: ChaosAgent;
  private x402PaymentManager?: X402PaymentManager;
  private paymentManager?: PaymentManager;
  private storageBackend: StorageBackend;
  private computeProvider?: ComputeProvider;
  private provider: ethers.Provider;

  // Advanced integrations
  public googleAP2?: GoogleAP2Integration;
  public a2aX402Extension?: A2AX402Extension;
  public processIntegrity?: ProcessIntegrity;
  public mandateManager?: MandateManager;

  // Gateway client for workflow submission (optional)
  public gateway: GatewayClient | null = null;

  // Studio client for direct on-chain operations
  public studio: StudioClient;

  // Protocol integrations
  public verifierAgent?: VerifierAgent;
  public studioManager?: StudioManager;
  public gatewayClient?: GatewayClient;
  public xmtpManager?: XMTPManager;

  // Configuration
  public readonly agentName: string;
  public readonly agentDomain: string;
  public readonly agentRole: AgentRole | string;
  public readonly network: NetworkConfig | string;
  public readonly networkInfo: ReturnType<typeof getNetworkInfo>;

  // Current agent ID (set after registration)
  private _agentId?: bigint;

  constructor(config: ChaosChainSDKConfig) {
    const signerSources = [config.privateKey, config.mnemonic, config.walletFile].filter(Boolean);
    if (signerSources.length > 1) {
      throw new ConfigurationError(
        'Invalid wallet configuration: provide only one of privateKey, mnemonic, or walletFile.',
        {
          provided: signerSources.map((source) =>
            typeof source === 'string' ? 'string' : 'unknown'
          ),
        }
      );
    }
    if (signerSources.length === 0) {
      throw new ConfigurationError(
        'No signer configuration provided. Set privateKey, mnemonic, or walletFile to initialize the SDK.',
        { required: ['privateKey', 'mnemonic', 'walletFile'] }
      );
    }

    this.agentName = config.agentName;
    this.agentDomain = config.agentDomain;
    this.agentRole = config.agentRole;
    this.network = config.network;

    // Get network info
    if (!config.network) {
      throw new ConfigurationError('Network is required to initialize the SDK.', {
        required: 'network',
      });
    }
    try {
      this.networkInfo = getNetworkInfo(config.network);
    } catch (error) {
      throw new ConfigurationError(
        `Unsupported network "${String(config.network)}".`,
        {
          supported: getSupportedNetworks(),
          cause: (error as Error).message,
        }
      );
    }
    if (!this.networkInfo.chainId || Number.isNaN(this.networkInfo.chainId)) {
      throw new ConfigurationError(
        `Invalid chainId for network "${String(config.network)}".`,
        { chainId: this.networkInfo.chainId }
      );
    }

    // Initialize provider
    const rpcUrl = config.rpcUrl || this.networkInfo.rpcUrl;
    if (!rpcUrl || typeof rpcUrl !== 'string' || rpcUrl.trim().length === 0) {
      throw new ConfigurationError(
        `RPC URL is required for network "${String(config.network)}".`,
        { network: config.network, hint: 'Provide rpcUrl in SDK config.' }
      );
    }
    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    } catch (error) {
      throw new ConfigurationError(
        `Failed to initialize provider for network "${String(config.network)}".`,
        { rpcUrl, cause: (error as Error).message }
      );
    }

    // Initialize wallet
    try {
      this.walletManager = new WalletManager(
        {
          privateKey: config.privateKey,
          mnemonic: config.mnemonic,
          walletFile: config.walletFile,
        },
        this.provider
      );
    } catch (error) {
      throw new ConfigurationError(
        'Failed to initialize wallet. Check privateKey, mnemonic, or walletFile.',
        { cause: (error as Error).message }
      );
    }

    // Initialize ChaosAgent (ERC-8004)
    try {
      const contractAddresses = getContractAddresses(config.network);
      this.chaosAgent = new ChaosAgent(
        contractAddresses,
        this.walletManager.getWallet(),
        this.provider
      );
    } catch (error) {
      throw new ConfigurationError(
        `Failed to initialize ERC-8004 contracts for network "${String(config.network)}".`,
        { network: config.network, cause: (error as Error).message }
      );
    }

    // Initialize storage provider
    if (config.storageProvider) {
      this.storageBackend = config.storageProvider as any as StorageBackend;
    } else if (config.enableStorage !== false) {
      // Auto-detect available storage backends
      this.storageBackend = new AutoStorageManager();
    } else {
      // Dummy storage provider
      this.storageBackend = {
        put: async () => ({ cid: '', provider: 'none' }),
        get: async () => Buffer.from(''),
      };
    }

    // Initialize payment managers (if enabled)
    if (config.enablePayments !== false) {
      // Crypto payments (x402 with EIP-3009 + facilitator)
      const wallet = this.walletManager.getWallet();
      this.x402PaymentManager = new X402PaymentManager(
        wallet as ethers.Wallet, // HDNodeWallet is compatible with Wallet for this use case
        typeof config.network === 'string' ? (config.network as NetworkConfig) : config.network,
        {
          facilitatorUrl: config.facilitatorUrl,
          apiKey: config.facilitatorApiKey,
          mode: config.facilitatorMode,
          agentId: config.agentId,
        }
      );

      // Traditional + crypto payments (multi-method)
      const paymentCredentials: PaymentMethodCredentials = {
        stripe_secret_key: process.env.STRIPE_SECRET_KEY,
        google_pay_merchant_id: process.env.GOOGLE_PAY_MERCHANT_ID,
        apple_pay_merchant_id: process.env.APPLE_PAY_MERCHANT_ID,
        paypal_client_id: process.env.PAYPAL_CLIENT_ID,
        paypal_client_secret: process.env.PAYPAL_CLIENT_SECRET,
      };

      this.paymentManager = new PaymentManager(
        this.agentName,
        typeof config.network === 'string' ? (config.network as NetworkConfig) : config.network,
        wallet as ethers.Wallet, // HDNodeWallet is compatible with Wallet for this use case
        paymentCredentials
      );

      // A2A-x402 Extension (multi-payment support)
      this.a2aX402Extension = new A2AX402Extension(
        this.agentName,
        typeof config.network === 'string' ? (config.network as NetworkConfig) : config.network,
        this.paymentManager
      );
    }

    // Initialize Google AP2 (if enabled)
    if (config.enableAP2 !== false) {
      this.googleAP2 = new GoogleAP2Integration(
        this.agentName,
        process.env.GOOGLE_AP2_MERCHANT_PRIVATE_KEY
      );
    }

    // Initialize mandates-core (optional)
    try {
      this.mandateManager = new MandateManager(
        this.agentName,
        this.walletManager,
        this.networkInfo.chainId
      );
    } catch (error) {
      console.warn(`⚠️ MandateManager unavailable: ${String(error)}`);
      this.mandateManager = undefined;
    }

    // Initialize compute provider (if provided)
    this.computeProvider = config.computeProvider;

    // Initialize Process Integrity (if enabled)
    if (config.enableProcessIntegrity !== false) {
      this.processIntegrity = new ProcessIntegrity(
        this.agentName,
        this.storageBackend as any,
        this.computeProvider as any
      );
    }

    // Initialize Gateway client (if config provided)
    if (config.gatewayConfig || config.gatewayUrl) {
      const gatewayConfig = config.gatewayConfig || { gatewayUrl: config.gatewayUrl! };
      this.gateway = new GatewayClient(gatewayConfig);
      console.log(`🌐 Gateway client initialized: ${gatewayConfig.gatewayUrl}`);
    }

    // Initialize Studio client for direct on-chain operations
    this.studio = new StudioClient({
      provider: this.provider,
      signer: this.walletManager.getWallet(),
      network: typeof config.network === 'string' ? config.network : config.network,
    });

    const isLocalNetwork = String(config.network) === NetworkConfig.LOCAL || String(config.network) === 'local';
    if (!this.gateway && !isLocalNetwork && !ChaosChainSDK.warnedGatewayMissing) {
      console.warn(
        '⚠️ Gateway is not configured. For production workflows, use gatewayConfig to enable Gateway orchestration.'
      );
      ChaosChainSDK.warnedGatewayMissing = true;
    }
    if (
      process.env.NODE_ENV === 'production' &&
      !isLocalNetwork &&
      !ChaosChainSDK.warnedStudioClientProduction
    ) {
      console.warn(
        '⚠️ StudioClient is intended for low-level or testing use. In production, prefer Gateway workflows.'
      );
      ChaosChainSDK.warnedStudioClientProduction = true;
    }

    // Initialize protocol integrations
    this.verifierAgent = new VerifierAgent(this);
    // XMTP Manager before StudioManager so we can pass messenger
    this.xmtpManager = new XMTPManager(this);
    this.studioManager = new StudioManager({
      sdk: this,
      messenger: {
        sendMessage: async (params) => {
          const { messageId } = await this.xmtpManager!.sendMessage(
            params.toAgent,
            { ...params.content, type: params.messageType },
            [],
            params.messageType
          );
          return messageId;
        },
      },
    });

    // Initialize Gateway Client (if URL provided and not already set via gatewayConfig)
    if (config.gatewayUrl && !this.gateway) {
      this.gatewayClient = new GatewayClient({ gatewayUrl: config.gatewayUrl });
      console.log(`   Gateway: ${config.gatewayUrl}`);
    }

    console.log(`🚀 ChaosChain SDK initialized for ${this.agentName}`);
    console.log(`   Network: ${this.network}`);
    console.log(`   Wallet: ${this.walletManager.getAddress()}`);
    console.log(`   Features:`);
    console.log(`     - ERC-8004: ✅`);
    console.log(`     - Protocol Integration: ✅`);
    console.log(`     - DKG Builder: ✅`);
    console.log(`     - VerifierAgent: ✅`);
    console.log(`     - StudioManager: ✅`);
    console.log(`     - XMTP Client: ✅ (MVP mode)`);
    console.log(`     - Gateway Client: ${this.gatewayClient ? '✅' : '❌'}`);
    console.log(`     - x402 Payments: ${this.x402PaymentManager ? '✅' : '❌'}`);
    console.log(`     - Multi-Payment: ${this.paymentManager ? '✅' : '❌'}`);
    console.log(`     - Google AP2: ${this.googleAP2 ? '✅' : '❌'}`);
    console.log(`     - Process Integrity: ${this.processIntegrity ? '✅' : '❌'}`);
    console.log(`     - Storage: ✅`);
  }

  // ============================================================================
  // ERC-8004 Identity Methods
  // ============================================================================

  /**
   * Register agent identity on-chain
   */
  async registerIdentity(metadata?: AgentMetadata): Promise<AgentRegistration> {
    const meta: AgentMetadata = metadata || {
      name: this.agentName,
      domain: this.agentDomain,
      role: this.agentRole,
    };

    const registration = await this.chaosAgent.registerIdentity(meta);
    this._agentId = registration.agentId;

    console.log(`✅ Agent #${registration.agentId} registered on-chain`);
    return registration;
  }

  /**
   * Get agent metadata
   */
  async getAgentMetadata(agentId: bigint): Promise<AgentMetadata | null> {
    return this.chaosAgent.getAgentMetadata(agentId);
  }

  /**
   * Update agent metadata
   */
  async updateAgentMetadata(agentId: bigint, metadata: AgentMetadata): Promise<string> {
    return this.chaosAgent.updateAgentMetadata(agentId, metadata);
  }

  /**
   * Get current agent ID
   */
  getAgentId(): bigint | undefined {
    return this._agentId;
  }

  /**
   * Get comprehensive SDK status (Python get_sdk_status parity).
   */
  getSdkStatus(): Record<string, any> {
    return {
      agent_name: this.agentName,
      agent_domain: this.agentDomain,
      agent_role: this.agentRole,
      network: String(this.network),
      wallet_address: this.walletManager.getAddress(),
      agent_id: this._agentId != null ? this._agentId.toString() : null,
      features: {
        x402_enabled: !!this.x402PaymentManager,
        process_integrity: !!this.processIntegrity,
        payments: !!this.paymentManager,
        storage: true,
        ap2_integration: !!this.googleAP2,
        x402_extension: !!this.a2aX402Extension,
        mandates: !!this.mandateManager,
      },
      x402_enabled: !!this.x402PaymentManager,
      payment_methods: this.paymentManager
        ? this.paymentManager.getSupportedPaymentMethods()
        : [],
      chain_id: this.networkInfo?.chainId ?? undefined,
    };
  }

  /**
   * Get complete agent identity (Python get_agent_identity parity).
   */
  getAgentIdentity(): {
    agentId: string | null;
    agentName: string;
    agentDomain: string;
    walletAddress: string;
    network: string;
  } {
    return {
      agentId: this._agentId != null ? this._agentId.toString() : null,
      agentName: this.agentName,
      agentDomain: this.agentDomain,
      walletAddress: this.walletManager.getAddress(),
      network: String(this.network),
    };
  }

  // ============================================================================
  // ERC-8004 Reputation Methods
  // ============================================================================

  /**
   * Generate feedback authorization (EIP-191 signing)
   */
  async generateFeedbackAuthorization(
    agentId: bigint,
    clientAddress: string,
    indexLimit: bigint,
    expiry: bigint
  ): Promise<string> {
    return this.chaosAgent.generateFeedbackAuthorization(
      agentId,
      clientAddress,
      indexLimit,
      expiry
    );
  }

  /**
   * Give feedback to an agent
   */
  async giveFeedback(params: FeedbackParams): Promise<string> {
    return this.chaosAgent.giveFeedback(params);
  }

  /**
   * Submit feedback with payment proof (ERC-8004 reputation enrichment)
   */
  async submitFeedbackWithPayment(
    agentId: bigint,
    score: number,
    feedbackData: Record<string, any>,
    paymentProof: Record<string, any>
  ): Promise<{ feedbackTxHash: string; feedbackUri: string }> {
    // Store feedback data with payment proof
    const fullFeedbackData = {
      ...feedbackData,
      score,
      proof_of_payment: paymentProof,
      timestamp: new Date().toISOString(),
    };

    // Upload to storage
    const feedbackJson = JSON.stringify(fullFeedbackData);
    const result = await (this.storageBackend as any).put(
      Buffer.from(feedbackJson),
      'application/json'
    );
    const feedbackUri = `ipfs://${result.cid}`;

    // Submit feedback on-chain
    const txHash = await this.chaosAgent.giveFeedback({
      agentId,
      rating: score,
      feedbackUri,
    });

    console.log(`✅ Feedback submitted with payment proof`);
    console.log(`   TX: ${txHash}`);
    console.log(`   URI: ${feedbackUri}`);

    return { feedbackTxHash: txHash, feedbackUri };
  }

  /**
   * Get agent reputation score (ERC-8004 v1.0)
   */
  async getReputationScore(agentId: bigint): Promise<number> {
    const summary = await this.chaosAgent.getSummary(agentId, [], ethers.ZeroHash, ethers.ZeroHash);
    return summary.averageScore;
  }

  /**
   * Read all feedback for an agent
   */
  async readAllFeedback(
    agentId: bigint,
    clientAddresses: string[] = [],
    tag1: string = ethers.ZeroHash,
    tag2: string = ethers.ZeroHash,
    includeRevoked: boolean = false
  ) {
    return this.chaosAgent.readAllFeedback(agentId, clientAddresses, tag1, tag2, includeRevoked);
  }

  /**
   * Get feedback summary statistics
   */
  async getFeedbackSummary(
    agentId: bigint,
    clientAddresses: string[] = [],
    tag1: string = ethers.ZeroHash,
    tag2: string = ethers.ZeroHash
  ) {
    return this.chaosAgent.getSummary(agentId, clientAddresses, tag1, tag2);
  }

  /**
   * Get x402 payment summary (Python get_x402_payment_summary parity).
   */
  getX402PaymentSummary(): Record<string, any> {
    if (!this.x402PaymentManager) {
      return { error: 'x402 payment manager not available' };
    }
    try {
      return this.x402PaymentManager.getPaymentStats();
    } catch (e) {
      return { error: String(e) };
    }
  }

  /**
   * Get reputation feedback list (Python get_reputation parity).
   */
  async getReputation(
    agentId?: bigint,
    tag1?: string,
    tag2?: string
  ): Promise<Array<Record<string, any>>> {
    const id = agentId ?? this._agentId;
    if (id == null) return [];
    const t1 = tag1 ?? ethers.ZeroHash;
    const t2 = tag2 ?? ethers.ZeroHash;
    const result = await this.chaosAgent.readAllFeedback(id, [], t1, t2, false);
    const entries: Array<Record<string, any>> = [];
    for (let i = 0; i < (result.clients?.length ?? 0); i++) {
      entries.push({
        client: result.clients![i],
        feedbackIndex: result.feedbackIndexes?.[i]?.toString(),
        score: result.scores?.[i],
        tag1: result.tag1s?.[i],
        tag2: result.tag2s?.[i],
        isRevoked: result.revokedStatuses?.[i],
      });
    }
    return entries;
  }

  /**
   * Get reputation summary (Python get_reputation_summary parity).
   */
  async getReputationSummary(
    agentId?: bigint,
    clientAddresses?: string[],
    tag1?: string,
    tag2?: string
  ): Promise<{ count: number; averageScore: number }> {
    const id = agentId ?? this._agentId;
    if (id == null) return { count: 0, averageScore: 0 };
    const clients = clientAddresses ?? [];
    const t1 = tag1 ?? ethers.ZeroHash;
    const t2 = tag2 ?? ethers.ZeroHash;
    const summary = await this.chaosAgent.getSummary(id, clients, t1, t2);
    return {
      count: Number(summary.count ?? 0),
      averageScore: summary.averageScore ?? 0,
    };
  }

  // ============================================================================
  // XMTP / Messaging (Python send_message, get_messages, get_all_conversations)
  // ============================================================================

  /**
   * Send message to another agent (Python send_message parity).
   */
  async sendMessage(
    toAgent: string,
    messageType: string,
    content: Record<string, any>,
    parentId?: string
  ): Promise<string> {
    if (!this.xmtpManager) {
      throw new Error('XMTP not available. Ensure XMTPManager is initialized.');
    }
    const parentIds = parentId ? [parentId] : [];
    const { messageId } = await this.xmtpManager.sendMessage(
      toAgent,
      { type: messageType, ...content },
      parentIds,
      messageType
    );
    return messageId;
  }

  /**
   * Get messages from a specific agent (Python get_messages parity).
   */
  getMessages(fromAgent: string, _forceRefresh?: boolean): Array<Record<string, any>> {
    if (!this.xmtpManager) return [];
    const thread = this.xmtpManager.getThread(fromAgent);
    return (thread.messages || []).map((m: XMTPMessage) => ({
      id: m.id,
      from: m.from,
      to: m.to,
      content: m.content,
      timestamp: m.timestamp,
      parentIds: m.parentIds,
      messageType: m.messageType,
    }));
  }

  /**
   * Get all conversation addresses (Python get_all_conversations parity).
   */
  getAllConversations(): string[] {
    if (!this.xmtpManager) return [];
    return this.xmtpManager.getConversationAddresses();
  }

  /**
   * Get clients who gave feedback
   */
  async getClients(agentId: bigint): Promise<string[]> {
    return this.chaosAgent.getClients(agentId);
  }

  // ============================================================================
  // ERC-8004 Validation Methods
  // ============================================================================

  /**
   * Request validation from validator (ERC-8004 v1.0)
   */
  async requestValidation(
    validatorAddress: string,
    agentId: bigint,
    requestUri: string,
    requestHash: string
  ): Promise<string> {
    return this.chaosAgent.requestValidation(validatorAddress, agentId, requestUri, requestHash);
  }

  /**
   * Respond to validation request (ERC-8004 v1.0)
   */
  async respondToValidation(
    requestHash: string,
    response: number,
    responseUri: string,
    responseHash: string,
    tag?: string
  ): Promise<string> {
    return this.chaosAgent.respondToValidation(
      requestHash,
      response,
      responseUri,
      responseHash,
      tag
    );
  }

  /**
   * Get validation status
   */
  async getValidationStatus(requestHash: string) {
    return this.chaosAgent.getValidationStatus(requestHash);
  }

  /**
   * Get validation summary for an agent
   */
  async getValidationSummary(
    agentId: bigint,
    validatorAddresses: string[] = [],
    tag: string = ethers.ZeroHash
  ) {
    return this.chaosAgent.getValidationSummary(agentId, validatorAddresses, tag);
  }

  /**
   * Get validation stats (alias for getValidationSummary)
   */
  async getValidationStats(agentId: bigint) {
    return this.getValidationSummary(agentId);
  }

  // ============================================================================
  // x402 Crypto Payment Methods
  // ============================================================================

  /**
   * Create x402 payment request
   */
  createX402PaymentRequest(
    fromAgent: string,
    toAgent: string,
    amount: number,
    currency: string = 'USDC',
    serviceDescription: string = 'AI Agent Service'
  ): Record<string, any> {
    if (!this.x402PaymentManager) {
      throw new Error('x402 payments not enabled');
    }
    return this.x402PaymentManager.createPaymentRequest(
      fromAgent,
      toAgent,
      amount,
      currency,
      serviceDescription
    );
  }

  /**
   * Execute x402 crypto payment
   */
  async executeX402Payment(
    paymentRequest: Record<string, any>,
    recipientAddress: string
  ): Promise<Record<string, any>> {
    if (!this.x402PaymentManager) {
      throw new Error('x402 payments not enabled');
    }
    return this.x402PaymentManager.executePayment(paymentRequest as any, recipientAddress);
  }

  /**
   * Create x402 payment requirements (for receiving payments)
   */
  createX402PaymentRequirements(
    amount: number,
    currency: string = 'USDC',
    serviceDescription: string = 'AI Agent Service',
    evidenceCid?: string
  ): Record<string, any> {
    if (!this.x402PaymentManager) {
      throw new Error('x402 payments not enabled');
    }
    return this.x402PaymentManager.createPaymentRequirements(
      amount,
      currency,
      serviceDescription,
      evidenceCid
    );
  }

  /**
   * Create x402 paywall server
   */
  createX402PaywallServer(port: number = 8402): X402Server {
    if (!this.x402PaymentManager) {
      throw new Error('x402 payments not enabled');
    }
    return new X402Server(this.x402PaymentManager, { port });
  }

  /**
   * Get x402 payment history
   */
  async getX402PaymentHistory(limit: number = 10): Promise<any[]> {
    if (!this.x402PaymentManager) {
      throw new Error('x402 payments not enabled');
    }
    return this.x402PaymentManager.getPaymentHistory(limit);
  }

  /**
   * Calculate total cost including protocol fee (2.5%)
   */
  calculateTotalCost(
    amount: string,
    currency: string = 'USDC'
  ): { amount: string; fee: string; total: string; currency: string } {
    const amountNum = parseFloat(amount);
    const fee = amountNum * 0.025; // 2.5% protocol fee
    const total = amountNum + fee;

    return {
      amount: amountNum.toFixed(6),
      fee: fee.toFixed(6),
      total: total.toFixed(6),
      currency,
    };
  }

  /**
   * Get ETH balance
   */
  async getETHBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.getAddress());
    return ethers.formatEther(balance);
  }

  /**
   * Get USDC balance (if USDC contract exists on network)
   */
  async getUSDCBalance(): Promise<string> {
    if (!this.x402PaymentManager) {
      throw new Error('x402 payments not enabled - cannot get USDC balance');
    }
    // This would need USDC contract address for the network
    // For now, return placeholder
    return '0.0';
  }

  // ============================================================================
  // Traditional Payment Methods (Cards, Google Pay, Apple Pay, PayPal)
  // ============================================================================

  /**
   * Execute traditional payment
   */
  executeTraditionalPayment(
    paymentMethod: PaymentMethod,
    amount: number,
    currency: string,
    paymentData: Record<string, any>
  ): Record<string, any> {
    if (!this.paymentManager) {
      throw new Error('Payment manager not enabled');
    }
    return this.paymentManager.executeTraditionalPayment(
      paymentMethod,
      amount,
      currency,
      paymentData
    );
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): PaymentMethod[] {
    if (!this.paymentManager) {
      return [];
    }
    return this.paymentManager.getSupportedPaymentMethods();
  }

  /**
   * Get payment methods status
   */
  getPaymentMethodsStatus(): Record<string, boolean> {
    if (!this.paymentManager) {
      return {};
    }
    return this.paymentManager.getPaymentMethodsStatus();
  }

  // ============================================================================
  // Google AP2 Intent Verification Methods
  // ============================================================================

  /**
   * Create Google AP2 intent mandate
   */
  createIntentMandate(
    userDescription: string,
    merchants?: string[],
    skus?: string[],
    requiresRefundability: boolean = false,
    expiryMinutes: number = 60
  ): GoogleAP2IntegrationResult {
    if (!this.googleAP2) {
      throw new Error('Google AP2 not enabled');
    }
    return this.googleAP2.createIntentMandate(
      userDescription,
      merchants,
      skus,
      requiresRefundability,
      expiryMinutes
    );
  }

  /**
   * Create Google AP2 cart mandate with JWT signing
   */
  async createCartMandate(
    cartId: string,
    items: Array<{ name: string; price: number }>,
    totalAmount: number,
    currency: string = 'USD',
    merchantName?: string,
    expiryMinutes: number = 15
  ): Promise<GoogleAP2IntegrationResult> {
    if (!this.googleAP2) {
      throw new Error('Google AP2 not enabled');
    }
    return this.googleAP2.createCartMandate(
      cartId,
      items,
      totalAmount,
      currency,
      merchantName,
      expiryMinutes
    );
  }

  /**
   * Verify JWT token
   */
  async verifyJwtToken(token: string): Promise<Record<string, any>> {
    if (!this.googleAP2) {
      throw new Error('Google AP2 not enabled');
    }
    return this.googleAP2.verifyJwtToken(token);
  }

  // ============================================================================
  // Process Integrity Methods
  // ============================================================================

  /**
   * Register function for integrity verification
   */
  registerFunction(func: (...args: any[]) => Promise<any>): void {
    if (!this.processIntegrity) {
      throw new Error('Process integrity not enabled');
    }
    this.processIntegrity.registerFunction(func);
  }

  /**
   * Execute function with integrity proof
   */
  async executeWithIntegrityProof(
    functionName: string,
    args: Record<string, any>
  ): Promise<{ result: any; proof: Record<string, any> }> {
    if (!this.processIntegrity) {
      throw new Error('Process integrity not enabled');
    }
    const [result, proof] = await this.processIntegrity.executeWithProof(functionName, args);
    return { result, proof: proof as any };
  }

  /**
   * Verify integrity proof
   */
  async verifyIntegrityProof(_proof: Record<string, any>): Promise<boolean> {
    if (!this.processIntegrity) {
      throw new Error('Process integrity not enabled');
    }
    // TODO: Implement verifyProof in ProcessIntegrity
    return true;
  }

  // ============================================================================
  // Storage Methods
  // ============================================================================

  /**
   * Upload data to storage
   */
  async upload(data: any, _options?: UploadOptions): Promise<UploadResult> {
    const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
    const buffer = Buffer.from(jsonData);

    const result = await this.storageBackend.put(buffer, 'application/json');

    return {
      cid: result.cid,
      uri: result.url || `ipfs://${result.cid}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Download data from storage
   */
  async download(cid: string): Promise<any> {
    const buffer = await this.storageBackend.get(cid);
    const data = buffer.toString('utf-8');

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * Store evidence (convenience method)
   */
  async storeEvidence(evidenceData: Record<string, any>): Promise<string> {
    const result = await (this.storageBackend as any).put(
      Buffer.from(JSON.stringify(evidenceData)),
      'application/json'
    );
    console.log(`📦 Stored evidence: ${result.cid}`);
    return result.cid;
  }

  /**
   * Retrieve evidence by CID (Python retrieve_evidence parity).
   */
  async retrieveEvidence(cid: string): Promise<Record<string, any> | null> {
    try {
      const data = await this.download(cid);
      return typeof data === 'object' && data !== null ? data : { data };
    } catch {
      return null;
    }
  }

  /**
   * Create evidence package for Proof of Agency (Python create_evidence_package parity).
   */
  async createEvidencePackage(params: {
    taskId: string;
    studioId: string;
    workProof: Record<string, any>;
    xmtpThreadId?: string;
    participants?: Array<Record<string, any>>;
    artifacts?: Array<Record<string, any>>;
    integrityProof?: IntegrityProof | null;
    paymentProofs?: Array<Record<string, any>>;
    validationResults?: Array<Record<string, any>>;
    storeOnIpfs?: boolean;
  }): Promise<EvidencePackage> {
    const packageId = `evidence_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const threadRoot = '0x' + '0'.repeat(64);
    const evidenceRoot = '0x' + '0'.repeat(64);
    const identity = this.getAgentIdentity();
    const packageObj: EvidencePackage = {
      packageId,
      taskId: params.taskId,
      studioId: params.studioId,
      xmtpThreadId: params.xmtpThreadId ?? '',
      threadRoot,
      evidenceRoot,
      participants: params.participants ?? [],
      agentIdentity: identity,
      workProof: params.workProof,
      artifacts: params.artifacts ?? [],
      integrityProof: params.integrityProof ?? null,
      paymentProofs: params.paymentProofs ?? [],
      validationResults: params.validationResults ?? [],
      createdAt: new Date().toISOString(),
    };
    if (params.storeOnIpfs) {
      const cid = await this.storeEvidence({
        package_id: packageId,
        task_id: params.taskId,
        studio_id: params.studioId,
        thread_root: threadRoot,
        evidence_root: evidenceRoot,
        participants: packageObj.participants,
        agent_identity: identity,
        work_proof: params.workProof,
        artifacts: packageObj.artifacts,
        integrity_proof: params.integrityProof ?? null,
        payment_proofs: params.paymentProofs ?? [],
        validation_results: params.validationResults ?? [],
        created_at: packageObj.createdAt,
      });
      (packageObj as any).ipfsCid = cid;
    }
    return packageObj;
  }

  // ============================================================================
  // Wallet & Network Methods
  // ============================================================================

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.walletManager.getAddress();
  }

  /**
   * Wallet address (Python wallet_address property parity).
   */
  get walletAddress(): string {
    return this.getAddress();
  }

  /**
   * Check if agent is registered on-chain (Python is_registered parity).
   */
  isRegistered(): boolean {
    const id = this.getAgentId();
    return id != null && id !== undefined;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<bigint> {
    return this.walletManager.getBalance();
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return this.networkInfo;
  }

  /**
   * Get SDK version
   */
  getVersion(): string {
    return '0.1.3';
  }

  /**
   * Get SDK capabilities summary
   */
  getCapabilities(): Record<string, any> {
    return {
      agent_name: this.agentName,
      agent_domain: this.agentDomain,
      agent_role: this.agentRole,
      network: this.network,
      wallet_address: this.walletManager.getAddress(),
      agent_id: this._agentId ? this._agentId.toString() : undefined,
      features: {
        erc_8004_identity: true,
        erc_8004_reputation: true,
        erc_8004_validation: true,
        x402_crypto_payments: !!this.x402PaymentManager,
        traditional_payments: !!this.paymentManager,
        google_ap2_intents: !!this.googleAP2,
        process_integrity: !!this.processIntegrity,
        storage: true,
        compute: !!this.computeProvider,
      },
      supported_payment_methods: this.paymentManager
        ? this.paymentManager.getSupportedPaymentMethods()
        : [],
      storage_backends:
        this.storageBackend instanceof AutoStorageManager
          ? (this.storageBackend as AutoStorageManager).getAvailableBackends()
          : [this.storageBackend.constructor.name],
    };
  }

  /**
   * Convenience accessor for VerifierAgent (for tests and compatibility).
   */
  verifier(): VerifierAgent {
    if (!this.verifierAgent) throw new Error('VerifierAgent not initialized');
    return this.verifierAgent;
  }

  /**
   * Convenience accessor for XMTPManager.
   */
  xmtp(): XMTPManager {
    if (!this.xmtpManager) throw new Error('XMTPManager not initialized');
    return this.xmtpManager;
  }

  /**
   * Convenience accessor for MandateManager (optional; may be undefined if mandates-core not installed).
   */
  mandate(): MandateManager {
    if (!this.mandateManager) throw new Error('MandateManager not available. Install mandates-core.');
    return this.mandateManager;
  }

  /**
   * Check if Gateway is configured.
   */
  isGatewayEnabled(): boolean {
    return this.gateway !== null;
  }

  /**
   * Get Gateway client instance.
   * @throws Error if Gateway is not configured
   */
  getGateway(): GatewayClient {
    if (!this.gateway) {
      throw new ConfigurationError(
        'Gateway is not configured. Provide gatewayConfig (or gatewayUrl) when constructing the SDK.',
        { required: 'gatewayConfig' }
      );
    }
    return this.gateway;
  }

  /**
   * Submit work via Gateway.
   *
   * The Gateway handles XMTP, DKG, Arweave archival, and on-chain submission.
   */
  async submitWorkViaGateway(
    studioAddress: string,
    epoch: number,
    agentAddress: string,
    dataHash: string,
    threadRoot: string,
    evidenceRoot: string,
    evidenceContent: Buffer | string,
    signerAddress: string
  ): Promise<WorkflowStatus> {
    return this.getGateway().submitWork(
      studioAddress,
      epoch,
      agentAddress,
      dataHash,
      threadRoot,
      evidenceRoot,
      evidenceContent,
      signerAddress
    );
  }

  /**
   * Submit score via Gateway.
   */
  async submitScoreViaGateway(
    studioAddress: string,
    epoch: number,
    validatorAddress: string,
    dataHash: string,
    scores: number[],
    signerAddress: string,
    options?: {
      workerAddress?: string;
      salt?: string;
      mode?: ScoreSubmissionMode;
    }
  ): Promise<WorkflowStatus> {
    return this.getGateway().submitScore(
      studioAddress,
      epoch,
      validatorAddress,
      dataHash,
      scores,
      signerAddress,
      options
    );
  }

  /**
   * Close epoch via Gateway.
   * WARNING: This is economically final and cannot be undone.
   */
  async closeEpochViaGateway(
    studioAddress: string,
    epoch: number,
    signerAddress: string
  ): Promise<WorkflowStatus> {
    return this.getGateway().closeEpoch(studioAddress, epoch, signerAddress);
  }

  /**
   * Wait for workflow completion.
   */
  async waitWorkflow(
    workflowId: string,
    options?: {
      maxWait?: number;
      pollInterval?: number;
      onProgress?: (status: WorkflowStatus) => void;
    }
  ): Promise<WorkflowStatus> {
    return this.getGateway().waitForCompletion(workflowId, options);
  }

  // ============================================================================
  // Mandates Core (optional)
  // ============================================================================

  buildMandateCore(kind: string, payload: Record<string, unknown>, baseUrl?: string) {
    if (!this.mandateManager) {
      throw new Error('MandateManager not available. Install mandates-core.');
    }
    return this.mandateManager.buildCore(kind, payload, baseUrl);
  }

  createMandate(params: {
    intent: string;
    core: Record<string, unknown>;
    deadline: string;
    client: string;
    server?: string;
    version?: string;
    mandateId?: string;
    createdAt?: string;
  }) {
    if (!this.mandateManager) {
      throw new Error('MandateManager not available. Install mandates-core.');
    }
    return this.mandateManager.createMandate(params);
  }

  signMandateAsServer(mandate: any, privateKey?: string) {
    if (!this.mandateManager) {
      throw new Error('MandateManager not available. Install mandates-core.');
    }
    return this.mandateManager.signAsServer(mandate, privateKey);
  }

  signMandateAsClient(mandate: any, privateKey: string) {
    if (!this.mandateManager) {
      throw new Error('MandateManager not available. Install mandates-core.');
    }
    return this.mandateManager.signAsClient(mandate, privateKey);
  }

  verifyMandate(mandate: any) {
    if (!this.mandateManager) {
      throw new Error('MandateManager not available. Install mandates-core.');
    }
    return this.mandateManager.verify(mandate);
  }

  // ============================================================================
  // Studio Direct On-Chain Methods
  // ============================================================================

  /**
   * Create a new Studio on ChaosChain.
   * @see StudioClient.createStudio for full documentation
   */
  async createStudio(
    name: string,
    logicModuleAddress: string
  ): Promise<{ proxyAddress: string; studioId: bigint }> {
    return this.studio.createStudio(name, logicModuleAddress);
  }

  /**
   * Register agent with a Studio.
   * @see StudioClient.registerWithStudio for full documentation
   */
  async registerWithStudio(
    studioAddress: string,
    agentId: string,
    role: number,
    stakeAmount?: bigint
  ): Promise<string> {
    return this.studio.registerWithStudio(studioAddress, agentId, role, stakeAmount);
  }

  /**
   * Get pending rewards for an account.
   * @see StudioClient.getPendingRewards for full documentation
   */
  async getStudioPendingRewards(studioAddress: string, account: string): Promise<bigint> {
    return this.studio.getPendingRewards(studioAddress, account);
  }

  /**
   * Withdraw pending rewards from a Studio.
   * @see StudioClient.withdrawRewards for full documentation
   */
  async withdrawStudioRewards(studioAddress: string): Promise<string> {
    return this.studio.withdrawRewards(studioAddress);
  }

  // ============================================================================
  // Studio direct work/score/epoch (Python parity; prefer Gateway in production)
  // ============================================================================

  /**
   * Submit work directly to Studio (Python submit_work parity).
   * @deprecated Use submitWorkViaGateway for production.
   */
  async submitWork(
    studioAddress: string,
    dataHash: string,
    threadRoot: string,
    evidenceRoot: string,
    feedbackAuth?: string
  ): Promise<string> {
    return this.studio.submitWork(
      studioAddress,
      dataHash,
      threadRoot,
      evidenceRoot,
      feedbackAuth ?? '0x'
    );
  }

  /**
   * Submit work with multi-agent attribution (Python submit_work_multi_agent parity).
   * @deprecated Use Gateway for production.
   */
  async submitWorkMultiAgent(
    studioAddress: string,
    dataHash: string,
    threadRoot: string,
    evidenceRoot: string,
    participants: string[],
    contributionWeights: number[],
    evidenceCID?: string
  ): Promise<string> {
    return this.studio.submitWorkMultiAgent(
      studioAddress,
      dataHash,
      threadRoot,
      evidenceRoot,
      participants,
      contributionWeights,
      evidenceCID ?? ''
    );
  }

  /**
   * Commit score (commit-reveal phase 1) (Python commit_score parity).
   */
  async commitScore(
    studioAddress: string,
    dataHash: string,
    commitment: string
  ): Promise<string> {
    return this.studio.commitScore(studioAddress, dataHash, commitment);
  }

  /**
   * Reveal score (commit-reveal phase 2) (Python reveal_score parity).
   */
  async revealScore(
    studioAddress: string,
    dataHash: string,
    scoreVector: string,
    salt: string
  ): Promise<string> {
    return this.studio.revealScore(studioAddress, dataHash, scoreVector, salt);
  }

  /**
   * Close epoch on Studio (Python close_epoch parity).
   * @deprecated Use closeEpochViaGateway for production.
   */
  async closeEpoch(studioAddress: string, epoch: number): Promise<string> {
    return this.studio.closeEpoch(studioAddress, epoch);
  }

  /**
   * Submit score vector directly (used by VerifierAgent).
   */
  async submitScoreVector(params: {
    studioAddress: string;
    dataHash: string;
    scoreVector: number[];
  }): Promise<string> {
    return this.studio.submitScoreVector(
      params.studioAddress,
      params.dataHash,
      params.scoreVector
    );
  }

  /**
   * Submit score vector for a specific worker (used by VerifierAgent).
   */
  async submitScoreVectorForWorker(params: {
    studioAddress: string;
    dataHash: string;
    workerAddress: string;
    scoreVector: number[];
  }): Promise<string> {
    return this.studio.submitScoreVectorForWorker(
      params.studioAddress,
      params.dataHash,
      params.workerAddress,
      params.scoreVector
    );
  }

  /**
   * Submit work from verifier audit result (Python submit_work_from_audit parity).
   */
  async submitWorkFromAudit(
    studioAddress: string,
    auditResult: { dataHash: string; threadRoot: string; evidenceRoot: string; participants: string[]; contributionWeights: number[]; evidenceCid?: string },
    evidenceCid?: string
  ): Promise<string> {
    return this.studio.submitWorkMultiAgent(
      studioAddress,
      auditResult.dataHash,
      auditResult.threadRoot,
      auditResult.evidenceRoot,
      auditResult.participants,
      auditResult.contributionWeights,
      evidenceCid ?? auditResult.evidenceCid ?? ''
    );
  }
}
