import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BackgroundVideo from "../../components/BackgroundVideo";
import GlassCard from "../../components/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { useTrading } from "../../context/TradingContext";
import { colors, spacing } from "../../lib/theme";

const GLACIAL_WHITE = "#F7F7FF";

export default function DashboardScreen() {
  const {
    balance,
    initialBalance,
    dailyLossPercent,
    cooldownActive,
    accountType,
    drawdownLocked,
    accountClosed,
    rScore,
  } = useTrading();

  const { logout } = useAuth();

  const formatMoney = (n) =>
    typeof n === "number"
      ? n.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "—";

  const normalizedAccountType = String(accountType || "").toUpperCase();

  const isInstitutional =
    normalizedAccountType === "INSTITUTIONAL_SELECTION" ||
    normalizedAccountType === "INSTITUTIONAL";

  const isAccess = normalizedAccountType === "ACCESS";

  const performanceAmount =
    initialBalance > 0
      ? Number((balance - initialBalance).toFixed(2))
      : 0;

  const performancePercent =
    initialBalance > 0
      ? (((balance - initialBalance) / initialBalance) * 100).toFixed(
          isInstitutional ? 4 : 2
        )
      : isInstitutional
      ? "0.0000"
      : "0.00";

  const performancePositive = performanceAmount > 0;
  const performanceNegative = performanceAmount < 0;

  async function handleLogout() {
    try {
      if (typeof logout === "function") {
        await logout();
      }
    } catch (e) {
      console.log("LOGOUT ERROR", e);
    }
  }

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.topSpacer} />
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={styles.logoutBtn}
          >
            <Text style={styles.logoutBtnText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Private Terminal of Riffard Funded</Text>

        <Text style={styles.accountLabel}>
          {isInstitutional ? "Institutional Selection" : "Riffard Access"}
        </Text>

        {accountClosed && (
          <Text style={styles.globalDanger}>ACCOUNT TERMINATED</Text>
        )}

        {drawdownLocked && !accountClosed && (
          <Text style={styles.globalWarn}>ACCOUNT RESTRICTED</Text>
        )}

        <GlassCard style={styles.card}>
          <Text style={styles.cardLabel}>Account Balance</Text>
          <Text style={styles.cardValueWhite}>{formatMoney(balance)} $</Text>
        </GlassCard>

        {isInstitutional && (
          <>
            <GlassCard style={styles.card}>
              <Text style={styles.cardLabel}>R-Score</Text>
              <Text style={styles.cardValueGold}>{rScore}</Text>
              <Text style={styles.cardSubtext}>
                Internal performance scoring system
              </Text>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.cardLabel}>Observation Mode</Text>
              <Text style={styles.cardValueGold}>ACTIVE</Text>
              <Text style={styles.cardSubtext}>
                Institutional Selection is used for observation, discipline and
                internal evaluation only.
              </Text>
            </GlassCard>
          </>
        )}

        <Text style={styles.sectionTitle}>Performance</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardLabel}>Overall Performance</Text>
          <Text
            style={[
              styles.cardValueGold,
              performancePositive && styles.positiveValue,
              performanceNegative && styles.negativeValue,
            ]}
          >
            {performancePositive ? "+" : ""}
            {performancePercent} %
          </Text>

          {isInstitutional && (
            <Text style={styles.cardSubtext}>
              Based on realized balance (no floating PnL)
            </Text>
          )}
        </GlassCard>

        {isAccess && (
          <GlassCard style={styles.card}>
            <Text style={styles.cardLabel}>Daily Cooldown</Text>
            <Text style={styles.cooldownDescription}>
              Loss ≥ 1% → locked until tomorrow
            </Text>
            <Text style={styles.cooldownValue}>
              {Number(dailyLossPercent || 0).toFixed(2)} %
            </Text>

            {cooldownActive && (
              <Text style={styles.statusWarn}>
                Trading disabled until next day reset.
              </Text>
            )}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  topSpacer: {
    flex: 1,
  },
  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  logoutBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    color: GLACIAL_WHITE,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: colors.gold,
    marginTop: 6,
  },
  accountLabel: {
    fontSize: 15,
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    marginBottom: spacing.lg,
  },
  globalDanger: {
    marginBottom: spacing.md,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#FF6B6B",
  },
  globalWarn: {
    marginBottom: spacing.md,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#FFD75A",
  },
  sectionTitle: {
    color: GLACIAL_WHITE,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cardLabel: {
    color: colors.gold,
    fontSize: 14,
    marginBottom: 6,
    textAlign: "center",
  },
  cardSubtext: {
    color: colors.gray,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  cardValueWhite: {
    color: GLACIAL_WHITE,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  cardValueGold: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  positiveValue: {
    color: "#4CFFB2",
  },
  negativeValue: {
    color: "#FF6B6B",
  },
  cooldownDescription: {
    color: GLACIAL_WHITE,
    fontSize: 14,
    textAlign: "center",
  },
  cooldownValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "700",
    color: colors.gold,
    textAlign: "center",
  },
  statusWarn: {
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
    color: "#FFD75A",
  },
});