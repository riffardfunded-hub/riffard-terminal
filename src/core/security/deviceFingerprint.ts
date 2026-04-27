import * as Crypto from "expo-crypto";
import * as Device from "expo-device";

export async function getDeviceHash(): Promise<string> {
  const raw = `${Device.osName}-${Device.modelName}-${Device.deviceYearClass}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
}
