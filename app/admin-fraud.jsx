import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../context/AuthContext";
import {
    getAdminFraudSignalsRequest,
    getAdminReviewCasesRequest,
} from "../lib/api";
import { colors, spacing } from "../lib/theme";

export default function AdminFraudScreen() {
  const { token } = useAuth();
  const [signals, setSignals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!token) return;

    try {
      setLoading(true);

      const [signalsRes, reviewsRes] = await Promise.all([
        getAdminFraudSignalsRequest(token),
        getAdminReviewCasesRequest(token),
      ]);

      setSignals(Array.isArray(signalsRes?.fraudSignals) ? signalsRes.fraudSignals : []);
      setReviews(Array.isArray(reviewsRes?.reviewCases) ? reviewsRes.reviewCases : []);
    } catch (e) {
      Alert.alert("Fraud load failed", e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [token]);

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Fraud Control</Text>

        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : (
          <>
            <Text style={styles.section}>Fraud Signals</Text>
            {signals.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.white}>{item.type}</Text>
                <Text style={styles.gray}>
                  Severity: {item.severity} • Score: {item.score}
                </Text>
                <Text style={styles.gray}>{item.reason}</Text>
                <Text style={styles.gray}>Status: {item.status}</Text>
              </View>
            ))}

            <Text style={styles.section}>Review Cases</Text>
            {reviews.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.white}>{item.type}</Text>
                <Text style={styles.gray}>
                  Priority: {item.priority} • Status: {item.status}
                </Text>
                <Text style={styles.gray}>{item.reason}</Text>
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
  empty: {
    color: colors.gray,
    textAlign: "center",
  },
});