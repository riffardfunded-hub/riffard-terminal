// components/AlertCard.jsx
import { Text } from "react-native";
import { colors } from "../lib/theme";
import GlassCard from "./GlassCard";

export default function AlertCard({ text, type = "info" }) {
  const colorMap = {
    info: colors.gray,
    danger: "#ff4d4d",
    success: "#4dff88",
    warning: "#ffcc00"
  };

  return (
    <GlassCard>
      <Text
        style={{
          color: colorMap[type],
          fontWeight: "600",
          fontSize: 14
        }}
      >
        {text}
      </Text>
    </GlassCard>
  );
}
