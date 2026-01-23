package com.amgeljodi.app.util

import com.amgeljodi.app.BuildConfig

/**
 * Application-wide constants
 */
object Constants {

    // URL Configuration
    object Urls {
        val PRODUCTION = BuildConfig.BASE_URL
        val DEBUG = BuildConfig.DEBUG_URL
        val ALLOW_TOGGLE = BuildConfig.ALLOW_URL_TOGGLE

        // Deep link paths
        const val PATH_PROFILE = "/profile"
        const val PATH_MATCHES = "/matches"
        const val PATH_MESSAGES = "/messages"
        const val PATH_SETTINGS = "/settings"
    }

    // JavaScript Bridge
    object Bridge {
        const val INTERFACE_NAME = "AmgelJodiNative"

        // Actions from web to native
        const val ACTION_PICK_IMAGES = "pickImages"
        const val ACTION_TAKE_PHOTO = "takePhoto"
        const val ACTION_SHARE = "share"
        const val ACTION_VIBRATE = "vibrate"
        const val ACTION_OPEN_SETTINGS = "openSettings"
        const val ACTION_CHECK_BIOMETRIC = "checkBiometric"
        const val ACTION_AUTHENTICATE_BIOMETRIC = "authenticateBiometric"
    }

    // Preferences Keys
    object Preferences {
        const val USE_DEBUG_URL = "use_debug_url"
        const val BIOMETRIC_ENABLED = "biometric_enabled"
        const val LAST_VISITED_URL = "last_visited_url"
    }

    // File Picker
    object FilePicker {
        const val MAX_IMAGES = 5
        const val MAX_IMAGE_SIZE_MB = 10
        const val IMAGE_QUALITY = 85
        const val CAPTURED_IMAGE_PREFIX = "AMGELJODI_"
    }

    // Request Codes (for older APIs)
    object RequestCodes {
        const val CAMERA_PERMISSION = 1001
        const val STORAGE_PERMISSION = 1002
        const val IMAGE_PICKER = 2001
        const val CAMERA_CAPTURE = 2002
    }

    // Timeouts
    object Timeouts {
        const val SPLASH_DELAY_MS = 1500L
        const val WEBVIEW_TIMEOUT_MS = 30000L
        const val BIOMETRIC_TIMEOUT_MS = 30000
    }
}
