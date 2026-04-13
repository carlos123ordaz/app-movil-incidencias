import type { ExpoConfig } from 'expo/config';

const config: { expo: ExpoConfig } = {
  expo: {
    name: "Viáticos",
    scheme: "corsusa",
    slug: "viaticoscorsusa",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
        NSLocationWhenInUseUsageDescription: "Necesitamos tu ubicación para registrar tu asistencia",
        ITSAppUsesNonExemptEncryption: false
      },
      bundleIdentifier: "com.carlosordazhoyos.appviaticos",
      googleServicesFile: "./GoogleService-Info.plist"
    },
    android: {
      package: "com.carlosordazhoyos.appviaticos",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE"
      ],
      googleServicesFile: "./google-services.json"
    },
    notification: {
      androidMode: "default",
      androidCollapsedTitle: "#{unread_notifications} nuevas notificaciones"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-sqlite",
      "expo-notifications",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      "./plugins/android-manifest-plugin",
      "expo-document-picker",
      "expo-web-browser",
      "expo-speech-recognition"
    ],
    extra: {
      "eas": {
        "projectId": "8b192739-db2d-4c42-90f2-16dd042bf2ee"
      }
    }
  }
};

export default config;