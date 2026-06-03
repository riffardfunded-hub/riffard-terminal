import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../lib/theme";

export default function IndexScreen() {
  const { authLoading, token, account } = useAuth();

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.black,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  console.log("INDEX TOKEN", token);
  console.log("INDEX ACCOUNT", account);

  if (token && account) {
    return <Redirect href="/markets" />;
  }

  return <Redirect href="/login" />;
}