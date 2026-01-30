import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  WorkflowType,
  WorkflowState,
  WorkflowStatus,
  WorkflowProgress,
  WorkflowError as WorkflowErrorType,
  GatewayClientConfig,
  ScoreSubmissionMode,
} from './types';
import {
  GatewayError,
  GatewayConnectionError,
  GatewayTimeoutError,
  WorkflowFailedError,
} from './exceptions';

export class GatewayClient {
  private gatewayUrl: string;
  private timeout: number;
  private maxPollTime: number;
  private pollInterval: number;

  constructor(config: GatewayClientConfig) {
    this.gatewayUrl = config.gatewayUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000; // Default timeout 30s
    this.maxPollTime = config.maxPollTime || 600000; // Default max poll time 10min
    this.pollInterval = config.pollInterval || 2000; // Default poll interval 2s
  }

  // ===========================================================================
  // Private: HTTP Request
  // ===========================================================================

  /**
   * Make HTTP request to Gateway.
   * Handles errors and transforms them to Gateway exceptions.
   */
  private async _request<T>(
    method: 'GET' | 'POST',
    path: string,
    data?: Record<string, any>
  ): Promise<T> {
    const url = `${this.gatewayUrl}${path}`;

    try {
      const response = await axios({
        method,
        url,
        data,
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;
    } catch (error) {
      this._handleError(error as AxiosError);
    }
  }

  /**
   * Transform axios errors to Gateway exceptions.
   */
  private _handleError(error: AxiosError): never {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new GatewayConnectionError(`Failed to connect to Gateway at ${this.gatewayUrl}`);
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new GatewayTimeoutError('timeout', `request to Gateway timed out: ${error.message}`);
    }

    if (error.response) {
      const data = error.response.data as any;
      const message = data?.error || data?.message || 'Unknown error from Gateway';
      throw new GatewayError(`Gateway returned error: ${message}`, {
        statusCode: error.response.status,
        response: data,
      });
    }

    throw new GatewayError(`Gateway request failed: ${error.message}`);
  }

  /**
   * Parse workflow status from API response.
   */
  private _parseWorkflowStatus(data: any): WorkflowStatus {
    const progress: WorkflowProgress = {
      arweaveTxId: data.progress?.arweave_tx_id,
      arweaveConfirmed: data.progress?.arweave_confirmed,
      onchainTxHash: data.progress?.onchain_tx_hash,
      onchainConfirmed: data.progress?.onchain_confirmed,
      onchainBlock: data.progress?.onchain_block,
      scoreTxHash: data.progress?.score_tx_hash,
      commitTxHash: data.progress?.commit_tx_hash,
      revealTxHash: data.progress?.reveal_tx_hash,
    };

    const error: WorkflowErrorType | undefined = data.error
      ? {
          step: data.error.step || '',
          message: data.error.message || '',
          code: data.error.code,
        }
      : undefined;

    return {
      workflowId: data.id,
      workflowType: data.type as WorkflowType,
      state: data.state as WorkflowState,
      step: data.step,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress,
      error,
    };
  }

  // ===========================================================================
  // Health Check
  // ===========================================================================
}
