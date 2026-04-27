import * as Crypto from "expo-crypto";
import { kvGet, kvSet } from "../storage/kv";
import { secureGet, secureSet } from "../storage/secure";

type LockEvent = {
  id: string;
  type: "DAILY_LOCK";
  reason: "DAILY_LOSS_LIMIT";
  lockedAt: number;
  unlockAt: number;
  equity?: number;
  floatingPnl?: number;

  // 🔗 LEGAL LINKS (OPTIONNEL - branché plus tard au backend)
  kycId?: string;
  accountId?: string;
  payoutCycleId?: string;

  // anti-tamper
  prevHash: string | null;
  hash: string;
  sig: string; // HMAC-like (best-effort local)

  // ✅ SIGNATURE SERVEUR
  serverSig?: string;

  // ✅ RFC3161 TSA TOKEN (horodatage légal) - fourni par ton serveur
  tsaToken?: string;
};

const KEY_LOG = "riffard:audit:locks:v1";
const KEY_SECRET = "riffard:audit:secret:v1";

// 🔐 URL API SIGNATURE (à ajuster plus tard)
const AUDIT_SIGN_ENDPOINT = "https://api.riffard.com/audit/sign";

// ⏱️ URL API RFC3161 (ton serveur appelle la TSA et renvoie un token)
const AUDIT_TIMESTAMP_ENDPOINT = "https://api.riffard.com/audit/timestamp";

async function getOrCreateSecret(): Promise<string> {
  const existing = await secureGet(KEY_SECRET);
  if (existing) return existing;

  // random secret per installation (best effort)
  const rnd = `${Date.now()}_${Math.random()}_${Math.random()}`;
  const secret = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rnd
  );
  await secureSet(KEY_SECRET, secret);
  return secret;
}

async function sha256(s: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);
}

function stableStringify(obj: any): string {
  const keys = Object.keys(obj).sort();
  const out: any = {};
  for (const k of keys) out[k] = obj[k];
  return JSON.stringify(out);
}

export async function getLockLog(): Promise<LockEvent[]> {
  return kvGet<LockEvent[]>(KEY_LOG, []);
}

export async function clearLockLog(): Promise<void> {
  await kvSet(KEY_LOG, []);
}

/**
 * Append a tamper-evident lock event
 * (hash chain + local signature + OPTIONAL server signature + OPTIONAL RFC3161 timestamp token).
 */
export async function appendDailyLockEvent(input: {
  lockedAt: number;
  unlockAt: number;
  equity?: number;
  floatingPnl?: number;

  // 🔗 links (optional)
  kycId?: string;
  accountId?: string;
  payoutCycleId?: string;
}): Promise<LockEvent> {
  const secret = await getOrCreateSecret();
  const log = await getLockLog();
  const prev = log.length ? log[0] : null; // newest first
  const prevHash = prev ? prev.hash : null;

  const base = {
    id: `${input.lockedAt}_${Math.random().toString(16).slice(2)}`,
    type: "DAILY_LOCK" as const,
    reason: "DAILY_LOSS_LIMIT" as const,
    lockedAt: input.lockedAt,
    unlockAt: input.unlockAt,
    equity: input.equity,
    floatingPnl: input.floatingPnl,

    // 🔗 legal links (optional)
    kycId: input.kycId,
    accountId: input.accountId,
    payoutCycleId: input.payoutCycleId,

    prevHash,
  };

  const hash = await sha256(stableStringify(base));
  const sig = await sha256(`${hash}:${secret}`); // local best-effort signature

  // 🌐 SIGNATURE SERVEUR (OPTIONNEL / OFFLINE-SAFE)
  let serverSig: string | undefined;
  try {
    const res = await fetch(AUDIT_SIGN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash }),
    });

    if (res.ok) {
      const json = await res.json();
      serverSig = json.serverSig;
    }
  } catch {
    // offline / API indisponible → audit reste local
  }

  // ⏱️ RFC3161 TSA TOKEN (OPTIONNEL / OFFLINE-SAFE)
  // Ton serveur fait l'appel TSA et renvoie un token (base64/hex/string).
  let tsaToken: string | undefined;
  try {
    const res = await fetch(AUDIT_TIMESTAMP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash }),
    });

    if (res.ok) {
      const json = await res.json();
      tsaToken = json.tsaToken;
    }
  } catch {
    // offline / API indisponible → pas de timestamp
  }

  const event: LockEvent = {
    ...base,
    hash,
    sig,
    serverSig,
    tsaToken,
  };

  const next = [event, ...log].slice(0, 2000); // cap
  await kvSet(KEY_LOG, next);

  return event;
}

/**
 * Verify chain integrity (detects edits/deletions/reordering).
 * Server signature / TSA token are NOT required to pass integrity,
 * but strengthen legal proof when present.
 */
export async function verifyLockLog(): Promise<{
  ok: boolean;
  brokenIndex: number | null;
}> {
  const secret = await getOrCreateSecret();
  const log = await getLockLog();

  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    const base = {
      id: e.id,
      type: e.type,
      reason: e.reason,
      lockedAt: e.lockedAt,
      unlockAt: e.unlockAt,
      equity: e.equity,
      floatingPnl: e.floatingPnl,

      // 🔗 legal links (optional)
      kycId: e.kycId,
      accountId: e.accountId,
      payoutCycleId: e.payoutCycleId,

      prevHash: e.prevHash,
    };

    const expectedHash = await sha256(stableStringify(base));
    const expectedSig = await sha256(`${expectedHash}:${secret}`);

    if (e.hash !== expectedHash) return { ok: false, brokenIndex: i };
    if (e.sig !== expectedSig) return { ok: false, brokenIndex: i };

    // chain check (newest-first)
    const nextOlder = log[i + 1];
    if (nextOlder) {
      if (e.prevHash !== nextOlder.hash) return { ok: false, brokenIndex: i };
    } else {
      if (e.prevHash !== null) return { ok: false, brokenIndex: i };
    }
  }

  return { ok: true, brokenIndex: null };
}
