// src/components/StatCard.js
import { Text, View } from "react-native";
import { colors, fonts, spacing } from "../constants/theme";

export default function StatCard({
  label,
  value,
  subvalue,
  tone = "default"
}) {
  let accent = colors.gold;
  if (tone === "danger") accent = colors.red;
  if (tone === "success") accent = colors.green;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(11,11,13,0.85)",
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: "rgba(212,175,55,0.18)",
        marginHorizontal: spacing.xs
      }}
    >
      <Text style={{ color: colors.gray, fontSize: fonts.small }}>{label}</Text>
      <Text
        style={{
          color: accent,
          fontSize: fonts.subtitle,
          fontWeight: "600",
          marginTop: 4
        }}
      >
        {value}
      </Text>
      {subvalue && (
        <Text
          style={{
            color: colors.gray,
            fontSize: fonts.small,
            marginTop: 2
          }}
        >
          {subvalue}
        </Text>
      )}
    </View>
  );
}
