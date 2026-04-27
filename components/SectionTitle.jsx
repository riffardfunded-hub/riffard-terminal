// components/SectionTitle.jsx
import { Text } from "react-native";
import { colors, fonts, spacing } from "../lib/theme";

export default function SectionTitle({ title }) {
  return (
    <Text
      style={{
        color: colors.white,
        fontSize: fonts.body,
        fontWeight: "600",
        marginBottom: spacing.sm
      }}
    >
      {title}
    </Text>
  );
}
