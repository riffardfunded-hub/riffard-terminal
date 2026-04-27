// components/StatCard.jsx
import { Text, View } from "react-native";
import { cardStyle, colors, fonts, spacing } from "../lib/theme";

export default function StatCard({ label, value, subvalue, tone = "default" }) {
  let accent = colors.gold;
  if (tone === "danger") accent = colors.red;
  if (tone === "success") accent = colors.green;

  return (
    <View
      style={{
        ...cardStyle,
        flex: 1,
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
      {subvalue ? (
        <Text
          style={{
            color: colors.gray,
            fontSize: fonts.small,
            marginTop: 2
          }}
        >
          {subvalue}
        </Text>
      ) : null}
    </View>
  );
}
