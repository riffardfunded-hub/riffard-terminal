import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import BackgroundVideo from "../../components/BackgroundVideo";
import { useAuth } from "../../context/AuthContext";
import { getPositionHistoryRequest } from "../../lib/api";
import { colors, spacing } from "../../lib/theme";

function formatMoney(n) {
  const value = Number(n || 0);
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)} $`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const { token, account } = useAuth();
  const [loading, setLoading] = useState(true);
  const [closes, setCloses] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!token || !account?.id) {
        if (mounted) {
          setLoading(false);
          setCloses([]);
        }
        return;
      }

      try {
        if (mounted) setLoading(true);

        const data = await getPositionHistoryRequest(token, account.id);

        if (!mounted) return;

        setCloses(Array.isArray(data?.closes) ? data.closes : []);
      } catch (e) {
        console.log("Load history failed", e);
        if (!mounted) {
          return;
        }
        setCloses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [token, account?.id]);

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>History</Text>

        {loading ? (
          <Text style={styles.placeholderText}>Loading history...</Text>
        ) : closes.length === 0 ? (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No closed positions yet.</Text>
          </View>
        ) : (
          closes.map((close) => {
            const isBuy = String(close.side || "").toUpperCase() === "BUY";
            const pnl = Number(close.pnlRealized || 0);
            const isPositive = pnl >= 0;

            return (
              <View key={close.id} style={styles.tradeCard}>
                <View style={styles.tradeTop}>
                  <Text style={styles.symbol}>{close.symbol || "—"}</Text>
                  <Text
                    style={[
                      styles.side,
                      {
                        color: isBuy ? colors.green : colors.red,
                      },
                    ]}
                  >
                    {close.side || "—"}
                  </Text>
                </View>

                <Text style={styles.kind}>
                  {close.kind === "CLOSE_FULL" ? "FULL CLOSE" : "PARTIAL CLOSE"}
                </Text>

                <Text style={styles.meta}>
                  Volume: {close.volume ?? "—"} • Entry: {close.entryPrice ?? "—"} •
                  Exit: {close.exitPrice ?? "—"}
                </Text>

                <Text style={styles.meta}>
                  Status after close: {close.statusAfterClose || "—"}
                </Text>

                <Text style={styles.meta}>
                  Date: {formatDate(close.createdAt)}
                </Text>

                <Text
                  style={[
                    styles.pnl,
                    {
                      color: isPositive ? colors.green : colors.red,
                    },
                  ]}
                >
                  {formatMoney(pnl)}
                </Text>
              </View>
            );
          })
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
  title: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.gray,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  placeholder: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  placeholderText: {
    textAlign: "center",
    color: colors.gray,
    fontSize: 14,
  },
  tradeCard: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tradeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  symbol: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  side: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  kind: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  meta: {
    color: colors.gray,
    fontSize: 13,
    marginBottom: 6,
  },
  pnl: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 4,
  },
});