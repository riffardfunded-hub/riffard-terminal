import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { colors, fonts, spacing } from "../lib/theme";

export default function PrimaryButton({ title, onPress, loading }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.gold,
        paddingVertical: spacing.md,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(212,175,55,0.45)",
        shadowColor: colors.gold,
        shadowOpacity: 0.25,
        shadowRadius: 10,
        marginBottom: spacing.sm
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.black} />
      ) : (
        <Text
          style={{
            color: colors.black,
            fontWeight: "700",
            fontSize: fonts.medium,
            textAlign: "center",
            letterSpacing: 0.5
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
