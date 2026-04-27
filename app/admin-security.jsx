import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../context/AuthContext";
import { getMaintenanceStatusRequest } from "../lib/api";
import { colors, spacing } from "../lib/theme";

export default function AdminSecurityScreen() {
  const { token } = useAuth();
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;

    try {
      setLoading(true);
      const res = await getMaintenanceStatusRequest(token);
      setMaintenance(res?.maintenance || null);
    } catch (e) {
      Alert.alert("Security load failed", e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  return (
    <View style={styles.root}>
      <BackgroundVideo />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Security</Text>

        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.white}>
              Maintenance: {maintenance?.enabled ? "ENABLED" : "DISABLED"}
            </Text>
            <Text style={styles.gray}>
              {maintenance?.message || "No maintenance message"}
            </Text>
          </View>
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