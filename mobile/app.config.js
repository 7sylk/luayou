const PUBLIC_BACKEND_URL = "https://luayou-backend-test.onrender.com";
const EAS_PROJECT_ID = "ad561039-07d9-4d1a-a8a3-4a61fbf1e0bc";

module.exports = () => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || PUBLIC_BACKEND_URL;

  return {
    expo: {
      name: "LuaYou",
      slug: "luayou",
      scheme: "luayou",
      version: "1.0.0",
      orientation: "portrait",
      userInterfaceStyle: "dark",
      splash: {
        backgroundColor: "#050505"
      },
      ios: {
        supportsTablet: false,
        bundleIdentifier: "com.luayou.app"
      },
      android: {
        package: "com.luayou.app",
        adaptiveIcon: {
          backgroundColor: "#050505"
        }
      },
      extra: {
        apiBaseUrl,
        eas: {
          projectId: EAS_PROJECT_ID
        }
      },
      plugins: [
        "expo-asset",
        "expo-font",
        [
          "expo-image-picker",
          {
            photosPermission: "Allow LuaYou to access your photos so you can update your avatar.",
            cameraPermission: "Allow LuaYou to use the camera so you can take a profile photo."
          }
        ]
      ]
    }
  };
};
