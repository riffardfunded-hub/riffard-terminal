// src/screens/SettingsScreen.js
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import TerminalHeader from "../components/TerminalHeader";
import { colors, fonts, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export default function SettingsScreen() {
  const { account, logout } = useAuth();

  // Clean label based on account type
  const accountLabel =
    account?.type === "ACCESS"
      ? "Riffard Access"
      : account?.type === "INSTITUTIONAL"
      ? "Institutional Selection"
      : "Riffard Account";

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <TerminalHeader title="Settings" subtitle="Riffard trader profile" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl
        }}
      >
        {/* ===== ACCOUNT ===== */}
        <View
          style={{
            backgroundColor: "#111118",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(212,175,55,0.18)",
            padding: spacing.md,
            marginBottom: spacing.lg
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontWeight: "600",
              marginBottom: 6
            }}
          >
            Connected account
          </Text>

          <Text style={{ color: colors.gray }}>
            {account?.label || accountLabel}
          </Text>

          <Text style={{ color: colors.gray, marginTop: 4 }}>
            Type: {account?.type || "—"}
          </Text>

          {account?.type === "INSTITUTIONAL" && (
            <Text
              style={{
                color: colors.gold,
                fontSize: fonts.small,
                marginTop: 8
              }}
            >
              Observation environment — no automatic payouts
            </Text>
          )}
        </View>

        {/* ===== LOGOUT ===== */}
        <TouchableOpacity
          onPress={logout}
          style={{
            backgroundColor: "rgba(255,75,75,0.12)",
            borderRadius: 999,
            paddingVertical: spacing.sm,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.red
          }}
        >
          <Text
            style={{
              color: colors.red,
              fontWeight: "600",
              fontSize: fonts.body
            }}
          >
            Log out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
