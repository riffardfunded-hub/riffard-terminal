// components/OrderBook.jsx
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { colors, spacing } from "../lib/theme";

export default function OrderBook() {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);

  useEffect(() => {
    const randomOrders = () => {
      const arr = [];

      for (let i = 0; i < 5; i++) {
        arr.push({
          price: (100 + Math.random() * 20).toFixed(2),
          size: (Math.random() * 5).toFixed(2)
        });
      }

      return arr;
    };

    setBids(randomOrders());
    setAsks(randomOrders());
  }, []);

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Asks */}
      <View>
        <Text style={{ color: colors.red, marginBottom: spacing.xs }}>
          Vendeurs (ASK)
        </Text>
        {asks.map((o, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4
            }}
          >
            <Text style={{ color: colors.red }}>{o.price}</Text>
            <Text style={{ color: colors.gray }}>{o.size}</Text>
          </View>
        ))}
      </View>

      {/* Bids */}
      <View style={{ marginTop: spacing.sm }}>
        <Text style={{ color: colors.green, marginBottom: spacing.xs }}>
          Acheteurs (BID)
        </Text>
        {bids.map((o, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4
            }}
          >
            <Text style={{ color: colors.green }}>{o.price}</Text>
            <Text style={{ color: colors.gray }}>{o.size}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
