// src/navigation/RootNavigator.js
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import ChartScreen from "../screens/ChartScreen";
import SlotsScreen from "../screens/SlotsScreen";
import TradeScreen from "../screens/TradeScreen";
import UpgradeScreen from "../screens/UpgradeScreen";
import AuthNavigator from "./AuthNavigator";
import MainTabNavigator from "./MainTabNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { authLoading, token } = useAuth();

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.black,
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Chart" component={ChartScreen} />
          <Stack.Screen name="Trade" component={TradeScreen} />
          <Stack.Screen name="Slots" component={SlotsScreen} />
          <Stack.Screen name="Upgrade" component={UpgradeScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
