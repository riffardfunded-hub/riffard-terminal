// src/navigation/MainTabNavigator.js
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "../constants/theme";
import DashboardScreen from "../screens/DashboardScreen";
import HistoryScreen from "../screens/HistoryScreen";
import MarketsScreen from "../screens/MarketsScreen";
import PayoutScreen from "../screens/PayoutScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#050509",
          borderTopColor: "#181824"
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.gray,
        tabBarIcon: ({ color, size }) => {
          let iconName = "ellipse";

          if (route.name === "Dashboard") iconName = "speedometer-outline";
          if (route.name === "Markets") iconName = "bar-chart-outline";
          if (route.name === "History") iconName = "list-outline";
          if (route.name === "Payouts") iconName = "card-outline";
          if (route.name === "Settings") iconName = "settings-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Payouts" component={PayoutScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
