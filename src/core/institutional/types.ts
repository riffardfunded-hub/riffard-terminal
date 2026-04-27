export type InstitutionalTier =
  | "NONE"
  | "ELIGIBLE_85"
  | "ACTIVE_85"
  | "ELIGIBLE_95"
  | "ACTIVE_95"
  | "INVITE_100";

export type ContractStatus =
  | "NOT_SHOWN"
  | "SHOWN"
  | "ACCEPTED"
  | "REVOKED";

export type PaymentStatus =
  | "INACTIVE"
  | "ACTIVE"
  | "SUSPENDED";

export interface InstitutionalState {
  userId: string;

  rScore: number;
  tier: InstitutionalTier;

  contractVersion: string;
  contractStatus: ContractStatus;
  contractAcceptedAt?: string;
  contractAcceptanceHash?: string;

  paymentStatus: PaymentStatus;
  monthlySalaryUsd: number;
  nextSalaryAt?: string;
  nextQuarterBonusAt?: string;

  lastUpdatedAt: string;
  lastEvent?: string;
}
