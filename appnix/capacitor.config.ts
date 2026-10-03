import type { CapacitorConfig } from '@capacitor/cli';
import { existsSync } from 'node:fs';

// Plugins que dependem do Firebase nativo só entram no APK quando existe
// android/app/google-services.json — sem ele, o app nativo fecharia ao iniciar.
const hasGoogleServices = existsSync('android/app/google-services.json');
const basePlugins = ['@capacitor/app', '@capacitor/camera', '@capacitor/geolocation', '@capacitor/preferences', 'capacitor-native-settings'];
const firebasePlugins = ['@capacitor-firebase/authentication', '@capacitor/push-notifications'];

const config: CapacitorConfig = {
  appId: 'com.appnix.app',
  appName: 'AppNix',
  webDir: 'dist-app',
  android: {
    allowMixedContent: false,
    includePlugins: hasGoogleServices ? [...basePlugins, ...firebasePlugins] : basePlugins,
  },
  plugins: {
    FirebaseAuthentication: {
      // Login Google nativo; a sessão é replicada no Firebase JS SDK via credencial.
      skipNativeAuth: true,
      providers: ['google.com'],
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
