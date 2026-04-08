# LuaYou Mobile

Expo-based Android app for LuaYou.

## Direction

- App name: `LuaYou`
- Package id: `com.luayou.app`
- Start with Expo Go, then build with EAS
- Match LuaYou's design language
- Use a stronger mobile-native layout for the learning flow

## Backend URL

The app now defaults to the public backend:

- `https://luayou-backend-test.onrender.com`

To test against a local backend instead, set:

- `EXPO_PUBLIC_API_URL=http://YOUR-LAN-IP:8010`

before running Expo.

## Build Commands

Preview APK:

```powershell
npx eas login
npx eas build -p android --profile preview
```

Production Android App Bundle:

```powershell
npx eas build -p android --profile production
```

You can also use:

```powershell
npm run build:apk
npm run build:aab
```
