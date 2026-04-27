// src/screens/ChartScreen.js
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { colors, fonts, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { getCandlesRequest } from "../services/api";

export default function ChartScreen({ route, navigation }) {
  const { symbol } = route.params;
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candles, setCandles] = useState([]);

  useEffect(() => {
    async function loadCandles() {
      try {
        const data = await getCandlesRequest(token, symbol, "M15");
        setCandles(data || []);
      } catch (e) {
        console.log("Error loading candles", e);
      } finally {
        setLoading(false);
      }
    }
    loadCandles();
  }, [symbol, token]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <View
        style={{
          paddingTop: spacing.xl,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md
        }}
      >
        <Text
          style={{
            color: colors.gold,
            fontSize: fonts.title,
            fontWeight: "700"
          }}
        >
          {symbol}
        </Text>
        <Text style={{ color: colors.gray, marginTop: 4 }}>
          Timeframe M15 – données simulées
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xl
          }}
        >
          <View
            style={{
              height: 260,
              borderRadius: 16,
              backgroundColor: "#111118",
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.18)",
              marginBottom: spacing.lg,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Text
              style={{
                color: colors.gray,
                fontSize: fonts.small,
                textAlign: "center",
                paddingHorizontal: spacing.md
              }}
            >
              Ici on branchera un vrai graphe bougies relié à Polygon.io.  
              Pour l’instant, les données `candles` sont déjà prêtes côté app.
            </Text>
          </View>

          <PrimaryButton
            title="Passer un trade sur ce marché"
            onPress={() =>
              navigation.navigate("Trade", {
                symbol
              })
            }
          />
        </ScrollView>
      )}
    </View>
  );
}
