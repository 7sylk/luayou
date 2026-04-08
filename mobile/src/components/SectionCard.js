import { View } from "react-native";
import { colors, spacing } from "../theme";

export default function SectionCard({ children, style }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          padding: spacing.lg
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
