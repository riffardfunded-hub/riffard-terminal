// src/screens/MarketsScreen.js
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import TerminalHeader from "../components/TerminalHeader";
import {
  cryptoPairs,
  forexPairs,
  indexPairs,
  metalPairs
} from "../constants/instruments";
import { colors, fonts, spacing } from "../constants/theme";

export default function MarketsScreen({ navigation }) {
  const renderGroup = (title, instruments) => (
    <View key={title} style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          color: colors.gray,
          fontSize: fonts.small,
          marginBottom: spacing.sm
        }}
      >
        {title}
      </Text>
      {instruments.map((symbol) => (
        <TouchableOpacity
          key={symbol}
          style={{
            backgroundColor: "#111118",
            borderRadius: 12,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderWidth: 1,
            borderColor: "rgba(212,175,55,0.18)",
            marginBottom: spacing.xs,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}
          onPress={() =>
            navigation.navigate("Chart", {
              symbol
            })
          }
        >
          <Text
            style={{
              color: colors.white,
              fontSize: fonts.body
            }}
          >
            {symbol}
          </Text>
          <Text style={{ color: colors.gold, fontSize: fonts.small }}>
            Ouvrir le graphe →
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <TerminalHeader
        title="Marchés"
        subtitle="Accès propriétaire Riffard Funded"
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl
        }}
      >
        {renderGroup("Forex", forexPairs)}
        {renderGroup("Crypto", cryptoPairs)}
        {renderGroup("Indices", indexPairs)}
        {renderGroup("Métaux", metalPairs)}
      </ScrollView>
    </View>
  );
}
