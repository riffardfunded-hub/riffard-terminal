// src/components/PrimaryButton.js
import { Text, TouchableOpacity } from "react-native";
import { colors, fonts, spacing } from "../constants/theme";

export default function PrimaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          backgroundColor: colors.gold,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center"
        },
        style
      ]}
    >
      <Text
        style={{
          color: colors.black,
          fontWeight: "600",
          fontSize: fonts.body
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
