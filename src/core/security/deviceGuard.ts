import { getDeviceHash } from "./deviceFingerprint";
import { loadFingerprints, saveFingerprints } from "./fingerprintVault";

export async function checkDevice(maxDevices = 2): Promise<boolean> {
  const hash = await getDeviceHash();
  const list = await loadFingerprints();

  if (list.find(d => d.hash === hash)) return true;
  if (list.length >= maxDevices) return false;

  list.push({ hash, createdAt: Date.now() });
  await saveFingerprints(list);
  return true;
}
