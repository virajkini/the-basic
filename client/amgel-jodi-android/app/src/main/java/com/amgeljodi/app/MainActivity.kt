package com.amgeljodi.app

import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.hilt.navigation.compose.hiltViewModel
import com.amgeljodi.app.bridge.WebViewBridge
import com.amgeljodi.app.ui.main.MainScreen
import com.amgeljodi.app.ui.splash.SplashViewModel
import com.amgeljodi.app.ui.theme.AmgelJodiTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/**
 * Main entry point for the Amgel Jodi Android app
 *
 * Handles:
 * - Splash screen with branding animation
 * - Biometric authentication (if enabled)
 * - WebView rendering of the web app
 * - Deep link handling
 * - Back navigation
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var webViewBridge: WebViewBridge

    private var deepLinkUrl: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        // Handle splash screen
        val splashScreen = installSplashScreen()

        super.onCreate(savedInstanceState)

        // Enable edge-to-edge display
        enableEdgeToEdge()

        // Handle deep links
        handleIntent(intent)

        // Keep splash screen while loading
        var keepSplash = true
        splashScreen.setKeepOnScreenCondition { keepSplash }

        // Secure the app - prevent screenshots in production
        if (!BuildConfig.DEBUG) {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }

        setContent {
            AmgelJodiTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AmgelJodiApp(
                        webViewBridge = webViewBridge,
                        deepLinkUrl = deepLinkUrl,
                        onNativeSplashComplete = { keepSplash = false }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    /**
     * Handle incoming intents (deep links, notifications)
     */
    private fun handleIntent(intent: Intent?) {
        intent ?: return

        // Handle deep link from URL
        intent.data?.let { uri ->
            deepLinkUrl = uri.toString()
        }

        // Handle notification deep link
        intent.getStringExtra("deepLink")?.let { link ->
            deepLinkUrl = link
        }
    }
}

/**
 * Root composable for the app
 * Goes directly to content - no extra splash screen for faster loading
 */
@Composable
private fun AmgelJodiApp(
    webViewBridge: WebViewBridge,
    deepLinkUrl: String?,
    onNativeSplashComplete: () -> Unit,
    splashViewModel: SplashViewModel = hiltViewModel()
) {
    val baseUrl by splashViewModel.baseUrl.collectAsState()

    // Dismiss native splash and go straight to content
    androidx.compose.runtime.LaunchedEffect(Unit) {
        onNativeSplashComplete()
    }

    // Go directly to WebView content - fastest loading
    val urlToLoad = deepLinkUrl ?: baseUrl

    MainScreen(
        baseUrl = urlToLoad,
        webViewBridge = webViewBridge
    )
}
