import { Text } from "react-native";
import { colors } from "../theme";

export function Eyebrow({ children, style }) {
  return (
    <Text style={[{ color: colors.faint, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }, style]}>
      {children}
    </Text>
  );
}

export function Title({ children, style }) {
  return <Text style={[{ color: colors.text, fontSize: 28, fontWeight: "700" }, style]}>{children}</Text>;
}

export function Body({ children, style, numberOfLines }) {
  return (
    <Text style={[{ color: colors.muted, fontSize: 14, lineHeight: 22 }, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}
