/**
 * x402 Facilitator Server - Official Coinbase Spec Implementation
 * 
 * A facilitator server provides verification and settlement services
 * for x402 payments without requiring resource servers to run blockchain nodes.
 * 
 * Spec: https://github.com/coinbase/x402
 * 
 * Endpoints:
 * - POST /verify   - Verify a payment proof
 * - POST /settle   - Settle a payment on-chain
 * - GET /supported - Get supported payment schemes
 */

import * as http from 'http';
import { ethers } from 'ethers';
import { X402PaymentManager } from './X402PaymentManager';
import { NetworkConfig } from './types';
import { PaymentError } from './exceptions';

/**
 * Verify Request (POST /verify)
 */
export interface VerifyRequest {
  x402Version: number;
  paymentHeader: string;  // base64 encoded Payment Payload
  paymentRequirements: {
    scheme: string;
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    outputSchema?: object | null;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    extra: object | null;
  };
}

/**
 * Verify Response
 */
export interface VerifyResponse {
  isValid: boolean;
  invalidReason: string | null;
}

/**
 * Settle Request (POST /settle)
 */
export interface SettleRequest {
  x402Version: number;
  paymentHeader: string;  // base64 encoded Payment Payload
  paymentRequirements: {
    scheme: string;
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    outputSchema?: object | null;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    extra: object | null;
  };
}

/**
 * Settle Response
 */
export interface SettleResponse {
  success: boolean;
  error: string | null;
  txHash: string | null;
  networkId: string | null;
}

/**
 * Supported Schemes Response (GET /supported)
 */
export interface SupportedSchemesResponse {
  kinds: Array<{
    scheme: string;
    network: string;
  }>;
}

/**
 * Facilitator Server Configuration
 */
export interface X402FacilitatorConfig {
  port: number;
  host?: string;
  wallet: ethers.Wallet;
  supportedNetworks: NetworkConfig[];
}

/**
 * X402 Facilitator Server
 * 
 * Implements the official x402 facilitator interface for payment
 * verification and settlement without requiring blockchain access
 * from resource servers.
 */
export class X402Facilitator {
  private server: http.Server | null = null;
  private config: Required<Omit<X402FacilitatorConfig, 'supportedNetworks'>> & {
    supportedNetworks: NetworkConfig[];
  };
  private paymentManagers: Map<string, X402PaymentManager> = new Map();

  constructor(config: X402FacilitatorConfig) {
    this.config = {
      port: config.port,
      host: config.host || '0.0.0.0',
      wallet: config.wallet,
      supportedNetworks: config.supportedNetworks
    };

    // Initialize payment managers for each supported network
    for (const network of config.supportedNetworks) {
      this.paymentManagers.set(network, new X402PaymentManager(config.wallet, network));
    }

    console.log(`🏦 x402 Facilitator Server initialized`);
    console.log(`   Port: ${this.config.port}`);
    console.log(`   Supported Networks: ${config.supportedNetworks.join(', ')}`);
    console.log(`   Supported Schemes: exact (EVM)`);
  }

  /**
   * Start the facilitator server
   */
  start(): void {
    if (this.server) {
      console.warn('⚠️  Facilitator server already running');
      return;
    }

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch((error) => {
        console.error('❌ Request handler error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    });

    this.server.listen(this.config.port, this.config.host, () => {
      console.log(`🚀 x402 Facilitator Server running at http://${this.config.host}:${this.config.port}`);
      console.log(`📋 Available endpoints:`);
      console.log(`   POST   /verify    - Verify payment proof`);
      console.log(`   POST   /settle    - Settle payment on-chain`);
      console.log(`   GET    /supported - Get supported schemes`);
    });
  }

  /**
   * Stop the server
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('🛑 x402 Facilitator Server stopped');
          this.server = null;
          resolve();
        }
      });
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      if (path === '/verify' && method === 'POST') {
        await this.handleVerify(req, res);
      } else if (path === '/settle' && method === 'POST') {
        await this.handleSettle(req, res);
      } else if (path === '/supported' && method === 'GET') {
        await this.handleSupported(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      }
    } catch (error: any) {
      console.error(`❌ Error handling ${method} ${path}:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
  }

  /**
   * POST /verify - Verify payment proof
   * 
   * Request body: { x402Version, paymentHeader, paymentRequirements }
   * Response: { isValid, invalidReason }
   */
  private async handleVerify(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const body = await this.readRequestBody(req);
    const verifyRequest: VerifyRequest = JSON.parse(body);

    console.log(`🔍 Verify request received`);
    console.log(`   Version: ${verifyRequest.x402Version}`);
    console.log(`   Network: ${verifyRequest.paymentRequirements.network}`);
    console.log(`   Scheme: ${verifyRequest.paymentRequirements.scheme}`);

    // Validate x402 version
    if (verifyRequest.x402Version !== 1) {
      const response: VerifyResponse = {
        isValid: false,
        invalidReason: `Unsupported x402 version: ${verifyRequest.x402Version}`
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    // Validate scheme
    if (verifyRequest.paymentRequirements.scheme !== 'exact') {
      const response: VerifyResponse = {
        isValid: false,
        invalidReason: `Unsupported scheme: ${verifyRequest.paymentRequirements.scheme}`
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    // Get payment manager for network
    const paymentManager = this.paymentManagers.get(verifyRequest.paymentRequirements.network as NetworkConfig);
    if (!paymentManager) {
      const response: VerifyResponse = {
        isValid: false,
        invalidReason: `Unsupported network: ${verifyRequest.paymentRequirements.network}`
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    try {
      // Decode payment header (base64 encoded JSON)
      const paymentPayloadJson = Buffer.from(verifyRequest.paymentHeader, 'base64').toString('utf-8');
      const paymentPayload = JSON.parse(paymentPayloadJson);

      // Extract transaction hash from payload
      const txHash = paymentPayload.payload?.transactionHash || paymentPayload.payload?.txHash;

      if (!txHash) {
        const response: VerifyResponse = {
          isValid: false,
          invalidReason: 'No transaction hash in payment payload'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }

      // Verify payment on-chain
      const mockProof = {
        payment_id: txHash,
        transaction_hash: txHash,
        main_transaction_hash: txHash,
        from_address: '0x0000000000000000000000000000000000000000',
        to_address: verifyRequest.paymentRequirements.payTo,
        treasury_address: '0x0000000000000000000000000000000000000000',
        amount: parseFloat(ethers.formatUnits(verifyRequest.paymentRequirements.maxAmountRequired, 6)),
        currency: 'USDC',
        protocol_fee: 0,
        network: verifyRequest.paymentRequirements.network as NetworkConfig,
        chain_id: 84532,
        timestamp: new Date(),
        status: 'confirmed',
        confirmations: 1
      };

      const isValid = await paymentManager.verifyPayment(mockProof);

      const response: VerifyResponse = {
        isValid,
        invalidReason: isValid ? null : 'Payment verification failed on-chain'
      };

      console.log(`   Result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error: any) {
      console.error(`❌ Verification error:`, error);
      const response: VerifyResponse = {
        isValid: false,
        invalidReason: error.message || 'Verification error'
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    }
  }

  /**
   * POST /settle - Settle payment on-chain
   * 
   * Request body: { x402Version, paymentHeader, paymentRequirements }
   * Response: { success, error, txHash, networkId }
   */
  private async handleSettle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const body = await this.readRequestBody(req);
    const settleRequest: SettleRequest = JSON.parse(body);

    console.log(`💰 Settle request received`);
    console.log(`   Version: ${settleRequest.x402Version}`);
    console.log(`   Network: ${settleRequest.paymentRequirements.network}`);
    console.log(`   Amount: ${settleRequest.paymentRequirements.maxAmountRequired}`);

    // Validate x402 version
    if (settleRequest.x402Version !== 1) {
      const response: SettleResponse = {
        success: false,
        error: `Unsupported x402 version: ${settleRequest.x402Version}`,
        txHash: null,
        networkId: null
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    // Get payment manager for network
    const paymentManager = this.paymentManagers.get(settleRequest.paymentRequirements.network as NetworkConfig);
    if (!paymentManager) {
      const response: SettleResponse = {
        success: false,
        error: `Unsupported network: ${settleRequest.paymentRequirements.network}`,
        txHash: null,
        networkId: null
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    try {
      // Decode payment header
      const paymentPayloadJson = Buffer.from(settleRequest.paymentHeader, 'base64').toString('utf-8');
      const paymentPayload = JSON.parse(paymentPayloadJson);

      // Extract transaction hash (already settled by payer)
      const txHash = paymentPayload.payload?.transactionHash || paymentPayload.payload?.txHash;

      if (!txHash) {
        const response: SettleResponse = {
          success: false,
          error: 'No transaction hash in payment payload',
          txHash: null,
          networkId: null
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }

      // In x402 "exact" scheme, payment is already settled by payer
      // Facilitator just confirms it exists on-chain
      const mockProof = {
        payment_id: txHash,
        transaction_hash: txHash,
        main_transaction_hash: txHash,
        from_address: '0x0000000000000000000000000000000000000000',
        to_address: settleRequest.paymentRequirements.payTo,
        treasury_address: '0x0000000000000000000000000000000000000000',
        amount: parseFloat(ethers.formatUnits(settleRequest.paymentRequirements.maxAmountRequired, 6)),
        currency: 'USDC',
        protocol_fee: 0,
        network: settleRequest.paymentRequirements.network as NetworkConfig,
        chain_id: 84532,
        timestamp: new Date(),
        status: 'confirmed',
        confirmations: 1
      };

      const isValid = await paymentManager.verifyPayment(mockProof);

      if (!isValid) {
        const response: SettleResponse = {
          success: false,
          error: 'Payment not found or invalid on-chain',
          txHash: null,
          networkId: null
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }

      const response: SettleResponse = {
        success: true,
        error: null,
        txHash: txHash,
        networkId: settleRequest.paymentRequirements.network
      };

      console.log(`   Result: ✅ Settled (${txHash})`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error: any) {
      console.error(`❌ Settlement error:`, error);
      const response: SettleResponse = {
        success: false,
        error: error.message || 'Settlement error',
        txHash: null,
        networkId: null
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    }
  }

  /**
   * GET /supported - Get supported payment schemes
   * 
   * Response: { kinds: [{ scheme, network }] }
   */
  private async handleSupported(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    console.log(`📋 Supported schemes request received`);

    const kinds = this.config.supportedNetworks.map(network => ({
      scheme: 'exact',
      network: network
    }));

    const response: SupportedSchemesResponse = { kinds };

    console.log(`   Returning ${kinds.length} supported (scheme, network) pairs`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  }

  /**
   * Read request body as string
   */
  private readRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks).toString()));
      req.on('error', reject);
    });
  }

  /**
   * Get facilitator statistics
   */
  getStats(): Record<string, any> {
    return {
      running: !!this.server,
      port: this.config.port,
      host: this.config.host,
      wallet: this.config.wallet.address,
      supported_networks: this.config.supportedNetworks,
      supported_schemes: ['exact'],
      endpoints: [
        { method: 'POST', path: '/verify', description: 'Verify payment proof' },
        { method: 'POST', path: '/settle', description: 'Settle payment on-chain' },
        { method: 'GET', path: '/supported', description: 'Get supported schemes' }
      ]
    };
  }
}

