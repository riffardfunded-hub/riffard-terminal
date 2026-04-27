import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function buildDevicePayload() {
  const androidId =
    Platform.OS === "android" && Application.getAndroidId
      ? Application.getAndroidId()
      : null;

  const iosId =
    Platform.OS === "ios" && Application.getIosIdForVendorAsync
      ? await Application.getIosIdForVendorAsync()
      : null;

  const deviceId =
    androidId ||
    iosId ||
    `${Device.brand || "device"}-${Device.modelName || "unknown"}`;

  const fingerprint = [
    Device.brand || "",
    Device.manufacturer || "",
    Device.modelName || "",
    Device.osName || "",
    Device.osVersion || "",
  ].join("|");

  return {
    deviceId,
    fingerprint,
    platform: Device.osName || null,
    appVersion: Application.nativeApplicationVersion || null,
    osVersion: Device.osVersion || null,
    deviceModel: Device.modelName || null,
    countryCode: null,
    city: null,
  };
}