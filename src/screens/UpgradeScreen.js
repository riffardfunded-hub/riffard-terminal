// src/screens/UpgradeScreen.js
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import TerminalHeader from "../components/TerminalHeader";
import { colors, fonts, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import {
  createUpgradeRequest,
  getUpgradesRequest
} from "../services/api";

export default function UpgradeScreen() {
  const { token } = useAuth();
  const [upgrades, setUpgrades] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getUpgradesRequest(token);
        setUpgrades(data || []);
      } catch (e) {
        console.log("Error upgrades", e);
      }
    }
    load();
  }, [token]);

  const handleUpgrade = async (up) => {
    try {
      setLoadingId(up.id);
      await createUpgradeRequest(token, up);
      Alert.alert(
        "Upgrade confirmed",
        `Your Access account is upgraded from ${up.from} to ${up.to}.`
      );
    } catch (e) {
      Alert.alert("Error", e.message || "Upgrade failed.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <TerminalHeader
        title="Access Upgrade"
        subtitle="Increase your monthly capital"
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl
        }}
      >
        {upgrades.map((up) => (
          <TouchableOpacity
            key={up.id}
            style={{
              backgroundColor: "#111118",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.18)",
              padding: spacing.md,
              marginBottom: spacing.sm
            }}
            onPress={() => handleUpgrade(up)}
            disabled={loadingId === up.id}
          >
            <Text
              style={{
                color: colors.white,
                fontWeight: "600",
                marginBottom: 4
              }}
            >
              {up.from} → {up.to}
            </Text>
            <Text style={{ color: colors.gold }}>
              {up.price.toFixed(2)} € / month
            </Text>
            <Text
              style={{
                color: colors.gray,
                fontSize: fonts.small,
                marginTop: 4
              }}
            >
              Tap to confirm the upgrade (mock for now).
            </Text>
          </TouchableOpacity>
        ))}

        {!upgrades.length && (
          <Text style={{ color: colors.gray, marginTop: spacing.lg }}>
            No upgrades available.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
