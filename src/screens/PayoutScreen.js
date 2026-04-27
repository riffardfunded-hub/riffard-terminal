// src/screens/PayoutScreen.js
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import TerminalHeader from "../components/TerminalHeader";
import { colors, fonts, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { getPayoutsRequest } from "../services/api";

export default function PayoutScreen() {
  const { token, account } = useAuth();
  const [payouts, setPayouts] = useState([]);

  const isAccess = account?.type === "ACCESS";
  const isInstitutional = account?.type === "INSTITUTIONAL";

  useEffect(() => {
    if (!isAccess) return;

    async function load() {
      try {
        const data = await getPayoutsRequest(token);
        setPayouts(data || []);
      } catch (e) {
        console.log("Error payouts", e);
      }
    }

    load();
  }, [token, isAccess]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <TerminalHeader
        title="Payouts"
        subtitle={
          isAccess
            ? "100% trader share — Riffard Access"
            : "No payouts — Institutional Selection"
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl
        }}
      >
        {/* INSTITUTIONAL MODE */}
        {isInstitutional && (
          <View
            style={{
              backgroundColor: "#111118",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.25)",
              padding: spacing.md
            }}
          >
            <Text
              style={{
                color: colors.gold,
                fontWeight: "700",
                marginBottom: 6
              }}
            >
              Institutional Program
            </Text>

            <Text style={{ color: colors.gray, lineHeight: 20 }}>
              This account is under institutional observation mode.
              {"\n\n"}
              No automatic payouts are available.
              Any potential remuneration is subject to a
              strictly discretionary decision by Riffard Group.
            </Text>
          </View>
        )}

        {/* ACCESS MODE */}
        {isAccess &&
          payouts.map((p) => (
            <View
              key={p.id}
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
                {p.date}
              </Text>

              <Text style={{ color: colors.green }}>
                Trader: {p.amountTrader.toLocaleString("en-US")} $
              </Text>

              <Text
                style={{
                  color: colors.gray,
                  fontSize: fonts.small,
                  marginTop: 4
                }}
              >
                Status: {p.status}
              </Text>
            </View>
          ))}

        {isAccess && !payouts.length && (
          <Text style={{ color: colors.gray, marginTop: spacing.lg }}>
            No payouts available at this time.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
