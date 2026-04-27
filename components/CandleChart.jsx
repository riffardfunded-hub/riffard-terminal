// components/CandleChart.jsx
import { View } from "react-native";
import { CandlestickChart } from "react-native-gifted-charts";

export default function CandleChart() {
  const data = [
    { high: 110, low: 90, open: 100, close: 105, date: "1 Jan" },
    { high: 120, low: 95, open: 110, close: 98, date: "2 Jan" },
    { high: 130, low: 110, open: 120, close: 125, date: "3 Jan" },
    { high: 118, low: 100, open: 115, close: 102, date: "4 Jan" },
  ];

  return (
    <View style={{ padding: 16 }}>
      <CandlestickChart
        data={data}
        height={260}
        width={330}
        candleColor="rgba(212,175,55,0.9)"
        positiveColor="rgba(212,175,55,0.9)"
        negativeColor="rgba(255,80,80,0.9)"
        lineColor="rgba(255,255,255,0.5)"
        yAxisColor="rgba(255,255,255,0.3)"
        xAxisColor="rgba(255,255,255,0.3)"
      />
    </View>
  );
}
