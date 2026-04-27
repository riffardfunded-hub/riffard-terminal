import { INSTITUTIONAL_CONFIG } from "./config";
import { InstitutionalState, InstitutionalTier } from "./types";

const now = () => new Date().toISOString();

export function computeTier(
  score: number,
  contractAccepted: boolean
): InstitutionalTier {
  if (score >= INSTITUTIONAL_CONFIG.THRESHOLDS.AT_100) return "INVITE_100";
  if (score >= INSTITUTIONAL_CONFIG.THRESHOLDS.AT_95)
    return contractAccepted ? "ACTIVE_95" : "ELIGIBLE_95";
  if (score >= INSTITUTIONAL_CONFIG.THRESHOLDS.AT_85)
    return contractAccepted ? "ACTIVE_85" : "ELIGIBLE_85";
  return "NONE";
}

export function salaryForTier(tier: InstitutionalTier): number {
  if (tier === "ACTIVE_95") return INSTITUTIONAL_CONFIG.SALARY.AT_95;
  if (tier === "ACTIVE_85") return INSTITUTIONAL_CONFIG.SALARY.AT_85;
  return 0;
}

export function applyInstitutionalRules(
  prev: InstitutionalState,
  newScore: number
): InstitutionalState {
  const accepted = prev.contractStatus === "ACCEPTED";
  const tier = computeTier(newScore, accepted);

  if (!accepted || tier.startsWith("ELIGIBLE") || tier === "NONE") {
    return {
      ...prev,
      rScore: newScore,
      tier,
      paymentStatus: "INACTIVE",
      monthlySalaryUsd: 0,
      lastUpdatedAt: now(),
      lastEvent: "NO_ACTIVE_CONTRACT",
    };
  }

  const salary = salaryForTier(tier);
  const threshold =
    tier === "ACTIVE_95"
      ? INSTITUTIONAL_CONFIG.THRESHOLDS.AT_95
      : INSTITUTIONAL_CONFIG.THRESHOLDS.AT_85;

  if (newScore < threshold) {
    return {
      ...prev,
      rScore: newScore,
      tier,
      paymentStatus: "SUSPENDED",
      monthlySalaryUsd: 0,
      lastUpdatedAt: now(),
      lastEvent: "PAYMENT_SUSPENDED_SCORE_DROP",
    };
  }

  return {
    ...prev,
    rScore: newScore,
    tier,
    paymentStatus: "ACTIVE",
    monthlySalaryUsd: salary,
    nextSalaryAt: prev.nextSalaryAt ?? new Date(Date.now() + 30 * 864e5).toISOString(),
    nextQuarterBonusAt:
      prev.nextQuarterBonusAt ?? new Date(Date.now() + 90 * 864e5).toISOString(),
    lastUpdatedAt: now(),
    lastEvent: `PAYMENT_ACTIVE_${salary}`,
  };
}
