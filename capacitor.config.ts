import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abuzahra.voip',
  appName: 'أبو الزهراء',
  webDir: 'out',
  server: {
    // For development
    // url: 'http://localhost:3000',
    // cleartext: true
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0078D7',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0078D7',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    backgroundColor: '#0078D7',
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
