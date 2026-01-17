import { AgentIdentity, IntegrityProof, PaymentProof, ValidationResult } from './types';

export type EvidencePackageParams = {
  packageId: string;
  taskId: string;
  studioId: string;
  xmtpThreadId: string;
  threadRoot: string;
  evidenceRoot: string;
  participants: Array<Record<string, unknown>>;
  agentIdentity: AgentIdentity;
  workProof: Record<string, unknown>;
  integrityProof?: IntegrityProof | null;
  paymentProofs: PaymentProof[];
  validationResults: ValidationResult[];
  artifacts?: Array<Record<string, unknown>> | null;
  ipfsCid?: string | null;
  createdAt?: Date | null;
};

/**
 * Comprehensive evidence package for proof of agency.
 * Includes XMTP thread for causal audit (§1.5) and multi-dimensional scoring (§3.1).
 */

export class EvidencePackage {
  readonly packageId: string;
  readonly taskId: string;
  readonly studioId: string;
  readonly xmtpThreadId: string;
  readonly threadRoot: string;
  readonly evidenceRoot: string;
  readonly participants: Array<Record<string, unknown>>;
  readonly agentIdentity: AgentIdentity;
  readonly workProof: Record<string, unknown>;
  readonly integrityProof: IntegrityProof | null;
  readonly paymentProofs: PaymentProof[];
  readonly validationResults: ValidationResult[];
  readonly artifacts: Array<Record<string, unknown>>;
  readonly ipfsCid: string | null;
  readonly createdAt: Date;

  constructor(params: EvidencePackageParams) {
    this.packageId = params.packageId;
    this.taskId = params.taskId;
    this.studioId = params.studioId;
    this.xmtpThreadId = params.xmtpThreadId;
    this.threadRoot = params.threadRoot;
    this.evidenceRoot = params.evidenceRoot;
    this.participants = params.participants;
    this.agentIdentity = params.agentIdentity;
    this.workProof = params.workProof;
    this.integrityProof = params.integrityProof ?? null;
    this.paymentProofs = params.paymentProofs;
    this.validationResults = params.validationResults;
    this.artifacts = params.artifacts ?? [];
    this.ipfsCid = params.ipfsCid ?? null;
    this.createdAt = params.createdAt ?? new Date();
  }
}
