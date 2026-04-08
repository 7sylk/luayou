import { Pressable, Text } from "react-native";
import { colors, spacing } from "../theme";

export default function PrimaryButton({ label, onPress, disabled = false, subtle = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: subtle ? colors.surfaceElevated : colors.accent,
        borderWidth: subtle ? 1 : 0,
        borderColor: colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
    >
      <Text
        style={{
          color: subtle ? colors.text : colors.accentText,
          textAlign: "center",
          fontSize: 14,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 1.2
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
