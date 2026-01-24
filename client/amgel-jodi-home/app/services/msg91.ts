/**
 * MSG91 OTP Service
 * Singleton service to manage MSG91 OTP widget
 *
 * Note: MSG91 only supports one initialization per page load.
 * The captcha verification persists until page refresh.
 */

const MSG91_WIDGET_ID = '3661726c7465313237383732'
const MSG91_TOKEN = '488918Td6ZDu0zhrG696cf807P1'
const CAPTCHA_CONTAINER_ID = 'msg91-captcha'

interface MSG91Config {
  widgetId: string
  tokenAuth: string
  exposeMethods: boolean
  captchaRenderId: string
}

declare global {
  interface Window {
    initSendOTP?: (config: MSG91Config) => void
    sendOtp?: (
      identifier: string,
      onSuccess?: () => void,
      onFailure?: (error: unknown) => void
    ) => void
    verifyOtp?: (
      otp: string,
      onSuccess?: (data: { message: string; type: string }) => void,
      onFailure?: (error: unknown) => void
    ) => void
    retryOtp?: (
      channel: string | null,
      onSuccess?: () => void,
      onFailure?: (error: unknown) => void
    ) => void
    isCaptchaVerified?: () => boolean
  }
}

class MSG91Service {
  private static instance: MSG91Service | null = null
  private initialized = false
  private scriptLoaded = false
  private initPromise: Promise<boolean> | null = null

  private constructor() {}

  static getInstance(): MSG91Service {
    if (!MSG91Service.instance) {
      MSG91Service.instance = new MSG91Service()
    }
    return MSG91Service.instance
  }

  getCaptchaContainerId(): string {
    return CAPTCHA_CONTAINER_ID
  }

  isScriptLoaded(): boolean {
    return this.scriptLoaded || (typeof window !== 'undefined' && !!window.initSendOTP)
  }

  markScriptLoaded(): void {
    this.scriptLoaded = true
  }

  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Initialize the MSG91 widget
   * Safe to call multiple times - will only initialize once
   */
  initialize(): Promise<boolean> {
    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      return this.initPromise
    }

    // Already initialized
    if (this.initialized) {
      return Promise.resolve(true)
    }

    this.initPromise = new Promise((resolve) => {
      // Check if script is ready
      if (typeof window === 'undefined' || !window.initSendOTP) {
        console.warn('MSG91: initSendOTP not available')
        this.initPromise = null
        resolve(false)
        return
      }

      // Check if container exists
      const container = document.getElementById(CAPTCHA_CONTAINER_ID)
      if (!container) {
        console.warn('MSG91: Captcha container not found')
        this.initPromise = null
        resolve(false)
        return
      }

      try {
        const config: MSG91Config = {
          widgetId: MSG91_WIDGET_ID,
          tokenAuth: MSG91_TOKEN,
          exposeMethods: true,
          captchaRenderId: CAPTCHA_CONTAINER_ID,
        }

        window.initSendOTP(config)
        this.initialized = true
        console.log('MSG91: Initialized successfully')
        resolve(true)
      } catch (error) {
        console.error('MSG91: Initialization failed', error)
        this.initPromise = null
        resolve(false)
      }
    })

    return this.initPromise
  }

  /**
   * Check if captcha is verified
   */
  isCaptchaVerified(): boolean {
    if (typeof window === 'undefined' || !window.isCaptchaVerified) {
      return false
    }
    return window.isCaptchaVerified()
  }

  /**
   * Send OTP to phone number
   */
  sendOtp(phone: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.sendOtp) {
        reject(new Error('OTP service not initialized'))
        return
      }

      window.sendOtp(
        phone,
        () => resolve(),
        (error) => reject(error)
      )
    })
  }

  /**
   * Verify OTP
   * @returns Access token on success
   */
  verifyOtp(otp: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.verifyOtp) {
        reject(new Error('OTP service not initialized'))
        return
      }

      window.verifyOtp(
        otp,
        (data) => resolve(data.message),
        (error) => reject(error)
      )
    })
  }

  /**
   * Resend OTP
   */
  resendOtp(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.retryOtp) {
        reject(new Error('OTP service not initialized'))
        return
      }

      window.retryOtp(
        null,
        () => resolve(),
        (error) => reject(error)
      )
    })
  }
}

// Export singleton instance
export const msg91 = MSG91Service.getInstance()
export default msg91
