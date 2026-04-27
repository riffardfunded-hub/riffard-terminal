// src/screens/LoginScreen.js
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View
} from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { colors, fonts, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required.");
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password.trim());
    } catch (e) {
      Alert.alert(
        "Login failed",
        e.message || "Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.black }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          justifyContent: "center"
        }}
      >
        <Text
          style={{
            color: colors.gold,
            fontSize: 32,
            fontWeight: "700",
            marginBottom: spacing.md,
            letterSpacing: 1
          }}
        >
          Riffard Funded Terminal
        </Text>
        <Text
          style={{
            color: colors.gray,
            fontSize: fonts.body,
            marginBottom: spacing.xl
          }}
        >
          Access restricted to Riffard funded traders.{"\n"}
          Use the same credentials as on the website.
        </Text>

        <Text style={{ color: colors.white, marginBottom: spacing.xs }}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="trader@riffard.com"
          placeholderTextColor={colors.gray}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: colors.blackSoft,
            borderRadius: 12,
            padding: spacing.sm,
            color: colors.white,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.graySoft
          }}
        />

        <Text style={{ color: colors.white, marginBottom: spacing.xs }}>
          Password
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.gray}
          secureTextEntry
          style={{
            backgroundColor: colors.blackSoft,
            borderRadius: 12,
            padding: spacing.sm,
            color: colors.white,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: colors.graySoft
          }}
        />

        <PrimaryButton
          title={loading ? "Connecting..." : "Enter the Terminal"}
          onPress={handleLogin}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
