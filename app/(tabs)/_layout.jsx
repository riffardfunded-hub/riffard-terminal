import { Redirect, Tabs } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import BackgroundVideo from "../../components/BackgroundVideo";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../lib/theme";

const TAB_ICON = require("../../assets/logo.png");
const ICON_SIZE = 18;

export default function TabsLayout() {
  const { authLoading, token, account } = useAuth();

  const normalizedAccountType = String(
    account?.type || account?.accountType || ""
  ).toUpperCase();

  const isInstitutional =
    normalizedAccountType === "INSTITUTIONAL" ||
    normalizedAccountType === "INSTITUTIONAL_SELECTION";

  if (authLoading) {
    return <View style={styles.root} />;
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <Tabs
        screenOptions={{
          headerShown: false,
          sceneContainerStyle: {
            backgroundColor: "transparent",
          },
          tabBarStyle: {
            backgroundColor: "rgba(0,0,0,0.85)",
            borderTopColor: "rgba(255,255,255,0.08)",
          },
          tabBarActiveTintColor: colors.gold,
          tabBarInactiveTintColor: colors.gray,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: () => (
              <Image
                source={TAB_ICON}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  tintColor: colors.gold,
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="markets"
          options={{
            title: "Markets",
            tabBarIcon: () => (
              <Image
                source={TAB_ICON}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  tintColor: colors.gold,
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="trades"
          options={{
            title: "Trades",
            tabBarIcon: () => (
              <Image
                source={TAB_ICON}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  tintColor: colors.gold,
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: () => (
              <Image
                source={TAB_ICON}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  tintColor: colors.gold,
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="payout"
          options={{
            href: isInstitutional ? null : undefined,
            title: "Payout",
            tabBarIcon: () => (
              <Image
                source={TAB_ICON}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  tintColor: colors.gold,
                }}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "black",
  },
});