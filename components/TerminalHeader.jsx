// components/TerminalHeader.jsx
import { Text, View } from "react-native";
import { colors, fonts, spacing } from "../lib/theme";

export default function TerminalHeader({ title, subtitle }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          color: colors.gold,
          fontSize: 28,
          fontWeight: "700",
          marginBottom: spacing.xs
        }}
      >
        {title}
      </Text>
      <Text style={{ color: colors.gray, fontSize: fonts.small }}>
        {subtitle}
      </Text>
    </View>
  );
}
