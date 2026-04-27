import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const GOLD = "#D4AF37";
const WHITE = "#F7F7FF";

export default function PremiumSplash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY: translate }],
        }}
      >
        <Text style={styles.riffard}>RIFFARD</Text>
        <Text style={styles.terminal}>TERMINAL</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },

  riffard: {
    color: WHITE,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
  },

  terminal: {
    color: GOLD,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 10,
    marginTop: 10,
    textAlign: "center",
  },
});