import { Text, View } from "react-native";
import { colors, spacing } from "../theme";

export default function StateBlock({ title, description, compact = false }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: compact ? spacing.md : spacing.xl,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs
      }}
    >
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: compact ? 15 : 16 }}>{title}</Text>
      {description ? (
        <Text
          style={{
            color: colors.muted,
            fontSize: 13,
            lineHeight: 20,
            textAlign: "center",
            maxWidth: 260
          }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}
