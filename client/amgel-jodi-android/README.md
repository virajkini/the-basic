# Amgel Jodi Android App

Native Android wrapper for the Amgel Jodi matrimony web application.

## Features

- **WebView Integration**: Renders the full web app with native enhancements
- **Native Camera/Gallery**: Direct photo capture and selection (max 5 photos)
- **Biometric Authentication**: Fingerprint/Face unlock support
- **Deep Linking**: Handle amgeljodi.com URLs directly in app
- **Debug Toggle**: Switch between localhost and production URLs (debug builds only)
- **Animated Splash Screen**: Branded loading experience

## Setup Instructions

### 1. Prerequisites

- Android Studio Ladybug (2024.2.1) or newer
- JDK 17+
- Android SDK 35

### 2. Open in Android Studio

```bash
# Open the project
open -a "Android Studio" /path/to/amgel-jodi-android
```

Or: File > Open > Select `amgel-jodi-android` folder

### 3. Create local.properties

Create `local.properties` in the project root:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### 4. Build & Run

```bash
# Debug build
./gradlew assembleDebug

# Release build (requires signing config)
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug
```

## Project Structure

```
app/src/main/java/com/amgeljodi/app/
├── AmgelJodiApp.kt          # Application class
├── MainActivity.kt           # Main entry point
├── bridge/
│   └── WebViewBridge.kt     # JavaScript-Native bridge
├── data/
│   ├── preferences/         # DataStore preferences
│   └── repository/          # Image processing
├── di/
│   └── AppModule.kt         # Hilt dependency injection
├── ui/
│   ├── components/          # Reusable UI components
│   ├── main/               # Main screen with WebView
│   ├── splash/             # Splash screen
│   ├── theme/              # Material 3 theme
│   └── webview/            # WebView wrapper
└── util/
    ├── BiometricHelper.kt   # Biometric authentication
    └── Constants.kt         # App constants
```

## JavaScript Bridge API

The web app can communicate with native Android using:

```javascript
// Check if running in native app
if (window.isAmgelJodiApp) {
  // Pick images from gallery (max 5)
  window.AmgelJodiNative.pickImages(5);

  // Take photo with camera
  window.AmgelJodiNative.takePhoto();

  // Native share
  window.AmgelJodiNative.share("Title", "Text", "https://url.com");

  // Vibrate
  window.AmgelJodiNative.vibrate(100);

  // Open app settings
  window.AmgelJodiNative.openSettings();

  // Biometric authentication
  window.AmgelJodiNative.checkBiometricAvailable();
  window.AmgelJodiNative.authenticateWithBiometric();

  // Get app info
  const info = JSON.parse(window.AmgelJodiNative.getAppInfo());
}

// Receive data from native
window.onNativeMessage = (type, data) => {
  switch (type) {
    case 'imagesSelected':
      // data = [{ base64: "data:image/jpeg;base64,...", width, height }, ...]
      break;
    case 'biometricStatus':
      // data = { available: true/false, status: "Available" }
      break;
    case 'biometricResult':
      // data = { success: true/false, error?: "..." }
      break;
  }
};
```

## Debug Features

In debug builds, a floating settings button appears that allows:
- Toggle between localhost:3000 and production URL
- Reload WebView
- Clear cache and data

## Play Store Compliance

This app includes native features to meet Google Play policy requirements:
- Native camera integration
- Biometric authentication
- Deep link handling
- Native share functionality

## Release Checklist

1. [ ] Update `versionCode` and `versionName` in `app/build.gradle.kts`
2. [ ] Create signing keystore and configure in `build.gradle.kts`
3. [ ] Generate signed APK/AAB
4. [ ] Test on multiple devices
5. [ ] Verify deep links work

## Environment Variables

Configure in `app/build.gradle.kts`:

| Variable | Debug | Release |
|----------|-------|---------|
| BASE_URL | https://www.amgeljodi.com | https://www.amgeljodi.com |
| DEBUG_URL | http://10.0.2.2:3000 | N/A |
| ALLOW_URL_TOGGLE | true | false |

## Adding Push Notifications (Optional)

If you want to add push notifications later:

1. Add Firebase to the project (see [Firebase docs](https://firebase.google.com/docs/android/setup))
2. Add `google-services.json` to `app/` folder
3. Uncomment Firebase dependencies in `build.gradle.kts`
4. Implement FCM service

## License

Proprietary - Amgel Jodi
