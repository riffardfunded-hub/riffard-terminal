import { secureGet, secureSet } from "../storage/secure";
import type { Fingerprint } from "./types";

const KEY = "riffard:fingerprints:v1";

export async function loadFingerprints(): Promise<Fingerprint[]> {
  const raw = await secureGet(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveFingerprints(list: Fingerprint[]): Promise<void> {
  await secureSet(KEY, JSON.stringify(list));
}
