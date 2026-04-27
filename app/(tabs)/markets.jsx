import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundVideo from "../../components/BackgroundVideo";
import GlassCard from "../../components/GlassCard";
import TerminalHeader from "../../components/TerminalHeader";
import { useTrading } from "../../context/TradingContext";
import { colors, fonts, spacing } from "../../lib/theme";

const MARKET_CATEGORIES = ["All", "Forex", "Crypto", "Indices", "Commodities"];

function normalizeSymbol(value) {
  return String(value || "").replace("/", "").toUpperCase();
}

export default function MarketsScreen() {
  const router = useRouter();
  const { prices } = useTrading();

  const [category, setCategory] = useState("All");

  const quotes = useMemo(() => {
    const rows = Object.entries(prices || {})
      .filter(([symbol]) => {
        const clean = String(symbol || "");
        return clean.includes("/") || !prices[normalizeSymbol(clean)];
      })
      .map(([symbol, price]) => {
        const normalized = normalizeSymbol(symbol);

        let itemCategory = "Other";
        if (
          normalized.includes("USD") ||
          normalized.includes("EUR") ||
          normalized.includes("GBP") ||
          normalized.includes("JPY") ||
          normalized.includes("AUD") ||
          normalized.includes("CAD") ||
          normalized.includes("CHF") ||
          normalized.includes("NZD")
        ) {
          itemCategory = "Forex";
        }

        if (
          normalized.includes("BTC") ||
          normalized.includes("ETH") ||
          normalized.includes("XRP")
        ) {
          itemCategory = "Crypto";
        }

        if (
          ["NAS100", "SPX500", "US30", "GER40", "FRA40", "UK100"].includes(
            normalized
          )
        ) {
          itemCategory = "Indices";
        }

        if (
          normalized.includes("XAU") ||
          normalized.includes("XAG") ||
          normalized.includes("OIL")
        ) {
          itemCategory = "Commodities";
        }

        return {
          symbol,
          category: itemCategory,
          price,
          percentChange: 0,
        };
      });

    const filtered =
      category === "All"
        ? rows
        : rows.filter((item) => item.category === category);

    return filtered.sort((a, b) =>
      String(a.symbol || "").localeCompare(String(b.symbol || ""))
    );
  }, [prices, category]);

  const renderRow = (item, index) => {
    const hasValidPrice =
      typeof item.price === "number" &&
      Number.isFinite(item.price) &&
      item.price > 0;

    const priceText = hasValidPrice
      ? item.price.toLocaleString("en-US", {
          maximumFractionDigits: 6,
        })
      : "—";

    return (
      <TouchableOpacity
        key={`${item.symbol}-${index}`}
        activeOpacity={0.7}
        onPress={() =>
          router.push(`/market/${encodeURIComponent(item.symbol)}`)
        }
        style={{ marginBottom: spacing.sm }}
      >
        <GlassCard
          style={{
            padding: spacing.md,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.price}>{priceText}</Text>

            <Text style={[styles.change, { color: colors.green }]}>
              +0.00%
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TerminalHeader title="Markets" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.lg }}
        >
          {MARKET_CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                activeOpacity={0.7}
                style={[
                  styles.categoryButton,
                  active && styles.categoryButtonActive,
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.gold : colors.white,
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {quotes.length === 0 ? (
          <Text style={styles.loadingText}>Waiting for live market data...</Text>
        ) : (
          quotes.map((item, index) => renderRow(item, index))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  symbol: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  category: {
    color: colors.gray,
    fontSize: fonts.small,
  },
  price: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  change: {
    fontWeight: "600",
    marginTop: 2,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.graySoft,
    backgroundColor: colors.blackSoft,
    marginRight: 10,
  },
  categoryButtonActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(212,175,55,0.15)",
  },
  loadingText: {
    color: colors.gray,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});