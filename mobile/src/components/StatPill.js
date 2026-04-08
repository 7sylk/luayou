import { View, Text } from "react-native";
import { colors, spacing } from "../theme";

export default function StatPill({ label, value }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minWidth: 88
      }}
    >
      <Text style={{ color: colors.faint, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.4 }}>
        {label}
      </Text>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 4 }}>{value}</Text>
    </View>
  );
}
