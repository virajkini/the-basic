package com.amgeljodi.app.bridge

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.amgeljodi.app.util.Constants
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * JavaScript interface for WebView-to-Native communication
 * Exposes native capabilities to the web application
 *
 * Web can call: window.AmgelJodiNative.methodName(args)
 */
@Singleton
class WebViewBridge @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) {
    private var webView: WebView? = null

    // Events emitted to native code
    private val _bridgeEvents = MutableSharedFlow<BridgeEvent>()
    val bridgeEvents: SharedFlow<BridgeEvent> = _bridgeEvents.asSharedFlow()

    // Coroutine scope for async operations
    private val scope = CoroutineScope(Dispatchers.Main)

    fun attachWebView(webView: WebView) {
        this.webView = webView
    }

    fun detachWebView() {
        this.webView = null
    }

    /**
     * Send data back to JavaScript
     * Calls: window.onNativeMessage(type, data)
     */
    fun sendToWeb(type: String, data: Any?) {
        val jsonData = gson.toJson(data)
        val script = "window.onNativeMessage && window.onNativeMessage('$type', $jsonData);"
        webView?.post {
            webView?.evaluateJavascript(script, null)
        }
    }

    // ========================
    // JavaScript Interface Methods
    // ========================

    /**
     * Request to pick images from gallery
     * @param maxCount Maximum number of images to pick (default: 5)
     */
    @JavascriptInterface
    fun pickImages(maxCount: Int = Constants.FilePicker.MAX_IMAGES) {
        val count = minOf(maxCount, Constants.FilePicker.MAX_IMAGES)
        scope.launch {
            _bridgeEvents.emit(BridgeEvent.PickImages(count))
        }
    }

    /**
     * Request to take a photo with camera
     */
    @JavascriptInterface
    fun takePhoto() {
        scope.launch {
            _bridgeEvents.emit(BridgeEvent.TakePhoto)
        }
    }

    /**
     * Share content using native share sheet
     * @param title Share dialog title
     * @param text Text content to share
     * @param url Optional URL to share
     */
    @JavascriptInterface
    fun share(title: String, text: String, url: String? = null) {
        val shareText = if (url != null) "$text\n$url" else text

        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, shareText)
            type = "text/plain"
        }

        val shareIntent = Intent.createChooser(sendIntent, title)
        shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(shareIntent)
    }

    /**
     * Trigger device vibration
     * @param duration Duration in milliseconds
     */
    @JavascriptInterface
    fun vibrate(duration: Long = 100) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(duration)
        }
    }

    /**
     * Open device settings
     * @param settingsType Type of settings to open (notifications, app, etc.)
     */
    @JavascriptInterface
    fun openSettings(settingsType: String = "app") {
        val intent = when (settingsType) {
            "notifications" -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    }
                } else {
                    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = android.net.Uri.parse("package:${context.packageName}")
                    }
                }
            }
            else -> {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = android.net.Uri.parse("package:${context.packageName}")
                }
            }
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    /**
     * Check if biometric authentication is available
     */
    @JavascriptInterface
    fun checkBiometricAvailable() {
        scope.launch {
            _bridgeEvents.emit(BridgeEvent.CheckBiometric)
        }
    }

    /**
     * Request biometric authentication
     */
    @JavascriptInterface
    fun authenticateWithBiometric() {
        scope.launch {
            _bridgeEvents.emit(BridgeEvent.AuthenticateBiometric)
        }
    }

    /**
     * Get app version info
     */
    @JavascriptInterface
    fun getAppInfo(): String {
        return gson.toJson(
            mapOf(
                "version" to com.amgeljodi.app.BuildConfig.VERSION_NAME,
                "versionCode" to com.amgeljodi.app.BuildConfig.VERSION_CODE,
                "platform" to "android",
                "sdkVersion" to Build.VERSION.SDK_INT
            )
        )
    }

    /**
     * Log message from web (for debugging)
     */
    @JavascriptInterface
    fun log(message: String) {
        android.util.Log.d("WebViewBridge", "Web: $message")
    }
}

/**
 * Events emitted from JavaScript bridge to be handled by native code
 */
sealed class BridgeEvent {
    data class PickImages(val maxCount: Int) : BridgeEvent()
    data object TakePhoto : BridgeEvent()
    data object CheckBiometric : BridgeEvent()
    data object AuthenticateBiometric : BridgeEvent()
}
