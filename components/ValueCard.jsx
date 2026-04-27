// components/ValueCard.jsx
import { Text } from "react-native";
import { colors, spacing } from "../lib/theme";
import GlassCard from "./GlassCard";

export default function ValueCard({ label, value, color }) {
  return (
    <GlassCard style={{ flex: 1 }}>
      <Text style={{ color: colors.gray, marginBottom: spacing.xs }}>
        {label}
      </Text>
      <Text style={{ color: color || colors.white, fontSize: 20, fontWeight: "700" }}>
        {value}
      </Text>
    </GlassCard>
  );
}
