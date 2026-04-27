import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../context/AuthContext";
import {
    approvePayoutRequest,
    getAdminAccountsRequest,
    getAdminAnomaliesRequest,
    getAdminPayoutsRequest,
    markPayoutPaidRequest,
    rejectPayoutRequest,
} from "../lib/api";
import { colors, spacing } from "../lib/theme";

export default function AdminScreen() {
  const { token } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!token) return;

    try {
      setLoading(true);

      const [a, p, an] = await Promise.all([
        getAdminAccountsRequest(token),
        getAdminPayoutsRequest(token),
        getAdminAnomaliesRequest(token),
      ]);

      setAccounts(Array.isArray(a?.accounts) ? a.accounts : []);
      setPayouts(Array.isArray(p?.payouts) ? p.payouts : []);
      setAnomalies(Array.isArray(an?.anomalies) ? an.anomalies : []);
    } catch (e) {
      Alert.alert("Admin load failed", e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [token]);

  const approve = async (payoutId) => {
    try {
      await approvePayoutRequest(token, payoutId);
      await loadAll();
    } catch (e) {
      Alert.alert("Approve failed", e?.message || "Unknown error");
    }
  };

  const reject = async (payoutId) => {
    try {
      await rejectPayoutRequest(token, payoutId, "Rejected by admin");
      await loadAll();
    } catch (e) {
      Alert.alert("Reject failed", e?.message || "Unknown error");
    }
  };

  const markPaid = async (payoutId) => {
    try {
      await markPayoutPaidRequest(token, payoutId);
      await loadAll();
    } catch (e) {
      Alert.alert("Mark paid failed", e?.message || "Unknown error");
    }
  };

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Riffard Admin</Text>

        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : (
          <>
            <Text style={styles.section}>Accounts</Text>
            {accounts.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.white}>{item.user?.email || item.userId}</Text>
                <Text style={styles.gray}>
                  {item.type} • {item.accountStatus || item.status}
                </Text>
                <Text style={styles.gray}>
                  Balance: {String(item.balance ?? "—")} • Equity: {String(item.equity ?? "—")}
                </Text>
              </View>
            ))}

            <Text style={styles.section}>Payouts</Text>
            {payouts.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.white}>Payout #{item.id}</Text>
                <Text style={styles.gray}>
                  Gross: {String(item.grossAmount)} • Net: {String(item.netAmount)}
                </Text>
                <Text style={styles.gray}>Status: {item.status}</Text>

                <View style={styles.row}>
                  <TouchableOpacity onPress={() => approve(item.id)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => reject(item.id)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => markPaid(item.id)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Paid</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.section}>Anomalies</Text>
            {anomalies.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.white}>{item.type}</Text>
                <Text style={styles.gray}>{item.reason}</Text>
                <Text style={styles.gray}>Status: {item.status}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  section: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  white: {
    color: colors.white,
    fontWeight: "800",
    marginBottom: 4,
  },
  gray: {
    color: colors.gray,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.15)",
  },
  actionText: {
    color: colors.gold,
    fontWeight: "800",
  },
  empty: {
    color: colors.gray,
    textAlign: "center",
  },
});