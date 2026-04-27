import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../context/AuthContext";
import {
    getDiditKycStatusRequest,
    startDiditKycRequest,
} from "../lib/api";
import { colors, spacing } from "../lib/theme";

export default function KycScreen() {
  const { token, account } = useAuth();
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [kyc, setKyc] = useState(null);

  const loadStatus = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await getDiditKycStatusRequest(token);
      setKyc(res?.kyc || null);
    } catch (e) {
      Alert.alert("KYC", e?.message || "Unable to load KYC status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [token]);

  const launchKyc = async () => {
    try {
      setLaunching(true);

      const res = await startDiditKycRequest(token, {
        fundedAccountId: account?.id || null,
      });

      if (!res?.verificationUrl) {
        throw new Error("No Didit verification URL returned.");
      }

      await WebBrowser.openBrowserAsync(res.verificationUrl);
      await loadStatus();
    } catch (e) {
      Alert.alert("KYC launch failed", e?.message || "Unknown error");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>KYC Verification</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Current status</Text>
          <Text style={styles.value}>
            {loading
              ? "Loading..."
              : kyc?.decisionStatus || kyc?.status || "Not started"}
          </Text>

          {kyc?.verificationUrl ? (
            <Text style={styles.helper}>
              A verification session already exists for your account.
            </Text>
          ) : (
            <Text style={styles.helper}>
              Start your identity verification through Didit.
            </Text>
          )}

          <TouchableOpacity
            onPress={launchKyc}
            disabled={launching}
            style={[styles.primaryBtn, launching && { opacity: 0.5 }]}
          >
            <Text style={styles.primaryBtnText}>
              {launching ? "Opening..." : "Start / Resume KYC"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  label: {
    color: colors.gold,
    marginBottom: 8,
    fontWeight: "700",
  },
  value: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  helper: {
    color: colors.gray,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#000",
    fontWeight: "900",
  },
});