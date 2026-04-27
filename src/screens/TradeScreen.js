// src/screens/TradeScreen.js
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { colors, fonts, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { openTradeRequest } from "../services/api";

export default function TradeScreen({ route, navigation }) {
  const { symbol } = route.params;
  const { token } = useAuth();
  const [lot, setLot] = useState("1.00");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = async (type) => {
    try {
      setLoading(true);
      const payload = {
        symbol,
        type,
        lot: parseFloat(lot) || 1,
        sl: sl ? parseFloat(sl) : null,
        tp: tp ? parseFloat(tp) : null
      };
      await openTradeRequest(token, payload);
      Alert.alert(
        "Trade opened",
        `${type} ${symbol} simulated successfully.`
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message || "Unable to open trade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.black }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          Simulated order ticket — Riffard Terminal
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={{ color: colors.white, marginBottom: spacing.xs }}>
          Size (lot)
        </Text>
        <TextInput
          value={lot}
          onChangeText={setLot}
          keyboardType="decimal-pad"
          placeholder="1.00"
          placeholderTextColor={colors.gray}
          style={{
            backgroundColor: colors.blackSoft,
            borderRadius: 12,
            padding: spacing.sm,
            color: colors.white,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.graySoft
          }}
        />

        <Text style={{ color: colors.white, marginBottom: spacing.xs }}>
          Stop Loss (optional)
        </Text>
        <TextInput
          value={sl}
          onChangeText={setSl}
          keyboardType="decimal-pad"
          placeholder="e.g. 1985.50"
          placeholderTextColor={colors.gray}
          style={{
            backgroundColor: colors.blackSoft,
            borderRadius: 12,
            padding: spacing.sm,
            color: colors.white,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.graySoft
          }}
        />

        <Text style={{ color: colors.white, marginBottom: spacing.xs }}>
          Take Profit (optional)
        </Text>
        <TextInput
          value={tp}
          onChangeText={setTp}
          keyboardType="decimal-pad"
          placeholder="e.g. 2010.00"
          placeholderTextColor={colors.gray}
          style={{
            backgroundColor: colors.blackSoft,
            borderRadius: 12,
            padding: spacing.sm,
            color: colors.white,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: colors.graySoft
          }}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: spacing.sm
          }}
        >
          <TouchableOpacity
            onPress={() => handleOpen("BUY")}
            style={{
              flex: 1,
              backgroundColor: "rgba(52,199,89,0.1)",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.green,
              paddingVertical: spacing.sm,
              alignItems: "center"
            }}
            disabled={loading}
          >
            <Text
              style={{ color: colors.green, fontWeight: "700", fontSize: 16 }}
            >
              BUY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOpen("SELL")}
            style={{
              flex: 1,
              backgroundColor: "rgba(255,75,75,0.1)",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.red,
              paddingVertical: spacing.sm,
              alignItems: "center"
            }}
            disabled={loading}
          >
            <Text
              style={{ color: colors.red, fontWeight: "700", fontSize: 16 }}
            >
              SELL
            </Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          title="Back to market"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
