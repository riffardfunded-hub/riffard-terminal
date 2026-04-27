// src/screens/DashboardScreen.js
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import StatCard from "../components/StatCard";
import TerminalHeader from "../components/TerminalHeader";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export default function DashboardScreen({ navigation }) {
  const { account, refreshAccount } = useAuth();

  useEffect(() => {
    refreshAccount();
  }, []);

  const ddRemainingPercent =
    account?.drawdownRemainingPercent != null
      ? `${account.drawdownRemainingPercent.toFixed(2)}%`
      : "-";

  const dailyCooldownActive = account?.isDailyCooldownActive;
  const accountClosed = account?.isClosed;

  // 🔁 LABEL TYPE DE COMPTE
  const accountLabel = account
    ? account.type === "ACCESS"
      ? "Riffard Access"
      : "Institutional Selection"
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <TerminalHeader
        title="Dashboard"
        subtitle={
          account
            ? `${accountLabel} • ${account.label || ""}`
            : "Chargement du compte..."
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl
        }}
      >
        {/* BALANCE / EQUITY */}
        <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
          <StatCard
            label="Balance"
            value={
              account ? `${account.balance.toLocaleString("en-US")} $` : "-"
            }
          />
          <StatCard
            label="Equity"
            value={
              account ? `${account.equity.toLocaleString("en-US")} $` : "-"
            }
          />
        </View>

        {/* DRAWDOWN / PAYOUT */}
        <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
          <StatCard
            label="Drawdown restant"
            value={ddRemainingPercent}
            subvalue={
              account
                ? `${account.drawdownRemainingAmount.toLocaleString(
                    "en-US"
                  )} $`
                : ""
            }
            tone="danger"
          />
          <StatCard
            label="Payout disponible"
            value={
              account &&
              account.type === "ACCESS" &&
              account.payoutAvailable != null
                ? `${account.payoutAvailable.toLocaleString("en-US")} $`
                : "-"
            }
            tone="success"
          />
        </View>

        {/* ÉTAT DU COMPTE */}
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
              marginBottom: 4
            }}
          >
            État du compte
          </Text>

          <Text style={{ color: colors.gray, marginBottom: 6 }}>
            {accountClosed
              ? "Compte bloqué — règles de risque dépassées."
              : dailyCooldownActive
              ? "Daily Cooldown actif — trading suspendu jusqu'à demain."
              : account?.type === "INSTITUTIONAL"
              ? "Mode observation institutionnelle — aucun payout."
              : "Compte actif — trading autorisé."}
          </Text>
        </View>

        {/* ACTIONS */}
        <PrimaryButton
          title="Accéder aux marchés"
          onPress={() => navigation.navigate("Markets")}
          style={{ marginBottom: spacing.md }}
        />

        <PrimaryButton
          title="Historique des trades"
          onPress={() => navigation.navigate("History")}
          style={{ marginBottom: spacing.md }}
        />

        {/* ACCESS UNIQUEMENT */}
        {account?.type === "ACCESS" && (
          <>
            <PrimaryButton
              title="Upgrade Riffard Access"
              onPress={() => navigation.navigate("Upgrade")}
              style={{ marginBottom: spacing.md }}
            />

            <PrimaryButton
              title="Payouts"
              onPress={() => navigation.navigate("Payouts")}
            />
          </>
        )}

        {/* INSTITUTIONAL UNIQUEMENT */}
        {account?.type === "INSTITUTIONAL" && (
          <PrimaryButton
            title="Programme Institutional"
            onPress={() => navigation.navigate("Institutional")}
          />
        )}
      </ScrollView>
    </View>
  );
}
