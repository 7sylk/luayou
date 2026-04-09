import { Image, Text, View } from "react-native";
import { colors } from "../theme";

export default function UserAvatar({ user, uri, size = 56 }) {
  const avatarUri = uri || (user?.avatar && user.avatar !== "default" ? user.avatar : null);
  const initial = user?.username?.charAt(0)?.toUpperCase() || "?";

  if (avatarUri) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: colors.border
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Text style={{ color: colors.accentText, fontWeight: "700", fontSize: Math.max(18, size * 0.33) }}>
        {initial}
      </Text>
    </View>
  );
}
