import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import PremiumSplash from "../components/PremiumSplash";
import { AuthProvider } from "../context/AuthContext";
import { TradingProvider } from "../context/TradingContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [showPremiumSplash, setShowPremiumSplash] = useState(true);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.hideAsync();
      } catch {}
      setNativeSplashHidden(true);

      const timer = setTimeout(() => {
        setShowPremiumSplash(false);
      }, 2200);

      return () => clearTimeout(timer);
    }

    const cleanupPromise = prepare();
    return () => {
      Promise.resolve(cleanupPromise).then((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
    };
  }, []);

  if (!nativeSplashHidden) {
    return <View style={{ flex: 1, backgroundColor: "#0B0B0D" }} />;
  }

  if (showPremiumSplash) {
    return <PremiumSplash />;
  }

  return (
    <AuthProvider>
      <TradingProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </TradingProvider>
    </AuthProvider>
  );
}