import { LinearGradient } from "expo-linear-gradient";

export default function GlassCard({ children, style }) {
  return (
    <LinearGradient
      colors={[
        "rgba(212,175,55,0.18)",
        "rgba(212,175,55,0.05)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: "100%",
          padding: 18,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(212,175,55,0.35)",

          // ❌ AUCUN background opaque
          // backgroundColor SUPPRIMÉ
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}
