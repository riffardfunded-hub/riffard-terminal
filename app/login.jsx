import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, spacing } from "../lib/theme";

export default function Login() {
  const router = useRouter();
  const { login, token, account, authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && token && account) {
      router.replace("/(tabs)");
    }
  }, [authLoading, token, account, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert(
        "Login failed",
        e?.message || "Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.brand}>Riffard Funded</Text>

          <Text style={styles.title}>Terminal Access</Text>

          <Text style={styles.subtitle}>
            Secure connection to the private trading infrastructure.
            {"\n"}
            Authorized users only.
          </Text>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="trader@riffard.com"
              placeholderTextColor={colors.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.gray}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <PrimaryButton
            title={loading ? "Connecting..." : "Enter the Terminal"}
            onPress={handleLogin}
            loading={loading}
          />
        </View>

        {/* FOOTER */}
        <Text style={styles.footerText}>
          Restricted access • Encrypted session • Internal system
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },

  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  brand: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },

  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
    opacity: 0.9,
  },

  subtitle: {
    color: colors.gray,
    fontSize: fonts.small,
    marginTop: spacing.md,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 26,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },

  inputGroup: {
    marginBottom: spacing.md,
  },

  label: {
    color: colors.white,
    marginBottom: spacing.xs,
    fontSize: fonts.body,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    fontSize: fonts.body,
  },

  footerText: {
    color: colors.gray,
    fontSize: fonts.small,
    textAlign: "center",
    marginTop: spacing.lg,
    opacity: 0.7,
  },
});