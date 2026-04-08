import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import AuthScreen from "../screens/AuthScreen";
import MainTabs from "./MainTabs";
import LessonScreen from "../screens/LessonScreen";
import PublicProfileScreen from "../screens/PublicProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import DeveloperScreen from "../screens/DeveloperScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: "Lesson" }} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: "Profile" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
          <Stack.Screen name="Developer" component={DeveloperScreen} options={{ title: "Developer" }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
