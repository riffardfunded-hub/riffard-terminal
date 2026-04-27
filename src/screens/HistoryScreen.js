// src/screens/HistoryScreen.js
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import TerminalHeader from "../components/TerminalHeader";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { getTradesRequest } from "../services/api";

export default function HistoryScreen() {
  const { token } = useAuth();
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTradesRequest(token);
        setTrades(data || []);
      } catch (e) {
        console.log("Error trades", e);
      }
    }
    load();
  }, [token]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <TerminalHeader
        title="Historique"
        subtitle="Journal des trades simulés"
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl
        }}
      >
        {trades.map((t) => (
          <View
            key={t.id}
            style={{
              backgroundColor: "#111118",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.18)",
              padding: spacing.md,
              marginBottom: spacing.sm
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontWeight: "600",
                marginBottom: 4
              }}
            >
              {t.symbol} • {t.type} • {t.lot} lot
            </Text>
            <Text style={{ color: t.pnl >= 0 ? colors.green : colors.red }}>
              P&L : {t.pnl.toLocaleString("en-US")} $
            </Text>
          </View>
        ))}

        {!trades.length && (
          <Text style={{ color: colors.gray, marginTop: spacing.lg }}>
            Aucun trade pour le moment.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
