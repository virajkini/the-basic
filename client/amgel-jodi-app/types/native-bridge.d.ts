// Type declarations for the Android WebView JavaScript bridge
// Set by AmgelJodiFCMService.kt via evaluateJavascript after page load

interface AmgelJodiNativeBridge {
  pickImages(maxCount?: number): void
  takePhoto(): void
  share(title: string, text: string, url?: string): void
  vibrate(duration?: number): void
  openSettings(settingsType?: string): void
  checkBiometricAvailable(): void
  authenticateWithBiometric(): void
  getAppInfo(): string
  getNotificationPermissionStatus(): string
  requestNotificationPermission(): void
  log(message: string): void
}

declare global {
  interface Window {
    isAndroidApp?: boolean
    isAmgelJodiApp?: boolean
    AmgelJodiNative?: AmgelJodiNativeBridge
    onNativeMessage?: (type: string, data: unknown) => void
    __AMGEL_NATIVE_CONTEXT?: { platform: string; fontScale: number }
  }
}

export {}
