import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { colors } from "../theme";

export default function Screen({ children, style }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>{children}</View>
    </SafeAreaView>
  );
}
