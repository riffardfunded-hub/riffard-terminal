import { simpleHash } from "../security/hash";
import { kvGet, kvSet } from "../storage/kv";
import { INSTITUTIONAL_CONFIG } from "./config";
import { applyInstitutionalRules } from "./engine";
import { InstitutionalState } from "./types";

const storageKey = (userId: string) => `riffard:institutional:${userId}`;

const defaultInstitutionalState = (userId: string): InstitutionalState => ({
  userId,
  rScore: 0,
  tier: "NONE",

  contractVersion: INSTITUTIONAL_CONFIG.CONTRACT_VERSION,
  contractStatus: "NOT_SHOWN",

  paymentStatus: "INACTIVE",
  monthlySalaryUsd: 0,

  lastUpdatedAt: new Date().toISOString(),
  lastEvent: "INIT",
});

export async function loadInstitutionalState(userId: string): Promise<InstitutionalState> {
  return await kvGet<InstitutionalState>(storageKey(userId), defaultInstitutionalState(userId));
}

export async function updateRScore(userId: string, newScore: number): Promise<InstitutionalState> {
  const prev = await loadInstitutionalState(userId);
  const next = applyInstitutionalRules(prev, newScore);
  await kvSet(storageKey(userId), next);
  return next;
}

export async function acceptInstitutionalContract(
  userId: string,
  contractText: string
): Promise<InstitutionalState> {
  const prev = await loadInstitutionalState(userId);

  // IMPORTANT:
  // On lie l’acceptation à (userId + version + texte) => si tu changes le texte / version,
  // l’empreinte change automatiquement.
  const acceptanceHash = simpleHash(
    `${userId}|${INSTITUTIONAL_CONFIG.CONTRACT_VERSION}|${contractText}`
  );

  const accepted: InstitutionalState = {
    ...prev,
    contractVersion: INSTITUTIONAL_CONFIG.CONTRACT_VERSION,
    contractStatus: "ACCEPTED",
    contractAcceptedAt: new Date().toISOString(),
    contractAcceptanceHash: acceptanceHash,
    lastUpdatedAt: new Date().toISOString(),
    lastEvent: "CONTRACT_ACCEPTED",
  };

  const finalState = applyInstitutionalRules(accepted, accepted.rScore);

  await kvSet(storageKey(userId), finalState);
  return finalState;
}
