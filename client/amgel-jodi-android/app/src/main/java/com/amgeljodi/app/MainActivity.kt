package com.amgeljodi.app

import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.hilt.navigation.compose.hiltViewModel
import com.amgeljodi.app.bridge.WebViewBridge
import com.amgeljodi.app.ui.main.MainScreen
import com.amgeljodi.app.ui.splash.SplashScreen
import com.amgeljodi.app.ui.splash.SplashState
import com.amgeljodi.app.ui.splash.SplashViewModel
import com.amgeljodi.app.ui.theme.AmgelJodiTheme
import com.amgeljodi.app.ui.webview.WebViewState
import com.amgeljodi.app.ui.webview.rememberWebViewState
import com.amgeljodi.app.util.BiometricHelper
import com.amgeljodi.app.util.BiometricStatus
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

    private var webViewState: WebViewState? = null
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
                        onSplashComplete = { keepSplash = false },
                        onWebViewStateCreated = { state -> webViewState = state }
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
 */
@Composable
private fun AmgelJodiApp(
    webViewBridge: WebViewBridge,
    deepLinkUrl: String?,
    onSplashComplete: () -> Unit,
    onWebViewStateCreated: (WebViewState) -> Unit,
    splashViewModel: SplashViewModel = hiltViewModel()
) {
    val splashState by splashViewModel.splashState.collectAsState()
    val baseUrl by splashViewModel.baseUrl.collectAsState()

    var showSplash by remember { mutableStateOf(true) }
    var needsBiometric by remember { mutableStateOf(false) }

    val webViewState = rememberWebViewState()

    // Track WebView state
    androidx.compose.runtime.LaunchedEffect(webViewState) {
        onWebViewStateCreated(webViewState)
    }

    // Handle splash state changes
    androidx.compose.runtime.LaunchedEffect(splashState) {
        when (splashState) {
            is SplashState.Loading -> {
                // Keep showing splash
            }
            is SplashState.RequiresBiometric -> {
                needsBiometric = true
            }
            is SplashState.Ready -> {
                showSplash = false
                onSplashComplete()
            }
        }
    }

    // Back button handling
    BackHandler(enabled = !showSplash) {
        if (webViewState.canGoBack) {
            webViewState.goBack()
        }
    }

    // UI
    if (showSplash) {
        SplashScreen(
            onSplashComplete = {
                if (splashState is SplashState.Ready) {
                    showSplash = false
                    onSplashComplete()
                }
            }
        )
    } else {
        // Determine URL to load
        val urlToLoad = deepLinkUrl ?: baseUrl

        MainScreen(
            baseUrl = urlToLoad,
            webViewBridge = webViewBridge
        )
    }
}
