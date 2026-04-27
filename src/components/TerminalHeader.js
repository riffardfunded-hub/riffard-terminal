// src/components/TerminalHeader.js
import { Text, View } from "react-native";
import { colors, fonts, spacing } from "../constants/theme";

export default function TerminalHeader({ title, subtitle }) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md
      }}
    >
      <Text
        style={{
          color: colors.gold,
          fontSize: fonts.title,
          fontWeight: "700",
          letterSpacing: 1
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            color: colors.gray,
            fontSize: fonts.small,
            marginTop: 4
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
