import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../context/AuthContext";
import {
    getAdminApiLogsRequest,
    getAdminAuditLogsRequest,
    getAdminJobRunsRequest,
} from "../lib/api";
import { colors, spacing } from "../lib/theme";

export default function AdminOpsScreen() {
  const { token } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [jobRuns, setJobRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!token) return;

    try {
      setLoading(true);

      const [auditRes, apiRes, jobRes] = await Promise.all([
        getAdminAuditLogsRequest(token),
        getAdminApiLogsRequest(token),
        getAdminJobRunsRequest(token),
      ]);

      setAuditLogs(Array.isArray(auditRes?.logs) ? auditRes.logs : []);
      setApiLogs(Array.isArray(apiRes?.logs) ? apiRes.logs : []);
      setJobRuns(Array.isArray(jobRes?.jobs) ? jobRes.jobs : []);
    } catch (e) {
      Alert.alert("Ops load failed", e?.message || "Unknown error");
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
        <Text style={styles.title}>Operations</Text>

        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : (
          <>
            <Text style={styles.section}>Audit Logs</Text>
            {auditLogs.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.white}>{item.eventType}</Text>
                <Text style={styles.gray}>{item.category} • {item.level}</Text>
                <Text style={styles.gray}>{item.message || "—"}</Text>
              </View>
            ))}

            <Text style={styles.section}>API Logs</Text>
            {apiLogs.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.white}>{item.route}</Text>
                <Text style={styles.gray}>
                  {item.method} • {item.statusCode} • {item.durationMs ?? "—"} ms
                </Text>
                <Text style={styles.gray}>{item.errorMessage || "OK"}</Text>
              </View>
            ))}

            <Text style={styles.section}>Job Runs</Text>
            {jobRuns.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.white}>{item.jobName}</Text>
                <Text style={styles.gray}>
                  {item.status} • {item.durationMs ?? "—"} ms
                </Text>
                <Text style={styles.gray}>
                  Success: {item.successCount} • Failure: {item.failureCount}
                </Text>
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