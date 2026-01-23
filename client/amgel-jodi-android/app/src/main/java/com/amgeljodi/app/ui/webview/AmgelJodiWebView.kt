package com.amgeljodi.app.ui.webview

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.amgeljodi.app.bridge.WebViewBridge
import com.amgeljodi.app.util.Constants

/**
 * State holder for WebView
 */
class WebViewState {
    var webView: WebView? = null
    var isLoading by mutableStateOf(true)
    var hasError by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)
    var progress by mutableStateOf(0)
    var currentUrl by mutableStateOf<String?>(null)
    var canGoBack by mutableStateOf(false)

    fun reload() {
        hasError = false
        errorMessage = null
        webView?.reload()
    }

    fun goBack(): Boolean {
        return if (webView?.canGoBack() == true) {
            // Use JavaScript history.back() to properly trigger popstate event for SPAs
            webView?.evaluateJavascript(
                """
                (function() {
                    // Dispatch custom event first so app knows back is from native
                    window.dispatchEvent(new CustomEvent('nativeBackPressed', {
                        detail: { source: 'android' }
                    }));
                    // Then trigger history.back() which fires popstate
                    history.back();
                })();
                """.trimIndent(),
                null
            )
            true
        } else {
            false
        }
    }

    fun loadUrl(url: String) {
        hasError = false
        errorMessage = null
        webView?.loadUrl(url)
    }
}

@Composable
fun rememberWebViewState(): WebViewState {
    return remember { WebViewState() }
}

/**
 * Composable WebView wrapper for Amgel Jodi
 * Handles JavaScript bridge, file upload, and error states
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AmgelJodiWebView(
    url: String,
    webViewBridge: WebViewBridge,
    state: WebViewState,
    modifier: Modifier = Modifier,
    onPageFinished: ((String) -> Unit)? = null,
    onFileUploadRequest: ((WebChromeClient.FileChooserParams) -> Unit)? = null
) {
    var fileChooserCallback by remember { mutableStateOf<((Array<android.net.Uri>?) -> Unit)?>(null) }

    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

                // Configure WebView settings
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

                    // Allow file access for uploads
                    allowFileAccess = true
                    allowContentAccess = true

                    // Modern web features
                    setSupportZoom(false)
                    builtInZoomControls = false
                    displayZoomControls = false
                    useWideViewPort = true
                    loadWithOverviewMode = true

                    // Performance
                    setRenderPriority(WebSettings.RenderPriority.HIGH)

                    // User agent (append app identifier)
                    val defaultUA = userAgentString
                    userAgentString = "$defaultUA AmgelJodiApp/1.0"
                }

                // Fix scroll behavior - disable overscroll for natural feel
                overScrollMode = View.OVER_SCROLL_NEVER
                isVerticalScrollBarEnabled = false
                isHorizontalScrollBarEnabled = false

                // Disable hardware acceleration on scroll to fix fling issues
                setLayerType(View.LAYER_TYPE_HARDWARE, null)

                // Enable smooth scrolling
                isNestedScrollingEnabled = true

                // Enable cookies
                val webView = this
                CookieManager.getInstance().apply {
                    setAcceptCookie(true)
                    setAcceptThirdPartyCookies(webView, true)
                }

                // Add JavaScript interface
                addJavascriptInterface(webViewBridge, Constants.Bridge.INTERFACE_NAME)
                webViewBridge.attachWebView(this)

                // WebView client for navigation handling
                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                        state.isLoading = true
                        state.hasError = false
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        state.isLoading = false
                        state.currentUrl = url
                        state.canGoBack = view?.canGoBack() == true
                        url?.let { onPageFinished?.invoke(it) }

                        // Inject native availability check and fix viewport for proper scroll
                        view?.evaluateJavascript(
                            """
                            window.isAmgelJodiApp = true;
                            window.isAndroidApp = true;
                            window.AmgelJodiNative && console.log('Native bridge ready');

                            // Ensure proper viewport for native-like scroll
                            var viewportMeta = document.querySelector('meta[name="viewport"]');
                            if (viewportMeta) {
                                var content = viewportMeta.getAttribute('content');
                                if (!content.includes('user-scalable=no')) {
                                    viewportMeta.setAttribute('content', content + ', user-scalable=no');
                                }
                            }

                            // Add smooth scroll behavior
                            document.documentElement.style.scrollBehavior = 'smooth';
                            document.documentElement.style.webkitOverflowScrolling = 'touch';

                            // Setup native back button handler helper
                            if (!window._nativeBackSetup) {
                                window._nativeBackSetup = true;
                                console.log('Native back button handler ready - listen for nativeBackPressed or popstate events');
                            }
                            """.trimIndent(),
                            null
                        )
                    }

                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?
                    ) {
                        // Only handle main frame errors
                        if (request?.isForMainFrame == true) {
                            state.hasError = true
                            state.isLoading = false
                            state.errorMessage = error?.description?.toString()
                        }
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        val requestUrl = request?.url?.toString() ?: return false

                        // Handle external links
                        return if (isExternalUrl(requestUrl)) {
                            // Open in external browser
                            val intent = android.content.Intent(
                                android.content.Intent.ACTION_VIEW,
                                android.net.Uri.parse(requestUrl)
                            )
                            context.startActivity(intent)
                            true
                        } else {
                            false
                        }
                    }
                }

                // Chrome client for file uploads and progress
                webChromeClient = object : WebChromeClient() {
                    override fun onProgressChanged(view: WebView?, newProgress: Int) {
                        state.progress = newProgress
                    }

                    override fun onShowFileChooser(
                        webView: WebView?,
                        filePathCallback: android.webkit.ValueCallback<Array<android.net.Uri>>?,
                        fileChooserParams: FileChooserParams?
                    ): Boolean {
                        fileChooserCallback = { uris ->
                            filePathCallback?.onReceiveValue(uris)
                        }
                        fileChooserParams?.let { onFileUploadRequest?.invoke(it) }
                        return true
                    }
                }

                state.webView = this
            }
        },
        update = { webView ->
            // Load URL if not already loaded
            if (webView.url == null || webView.url != url) {
                webView.loadUrl(url)
            }
        }
    )

    // Cleanup
    DisposableEffect(Unit) {
        onDispose {
            webViewBridge.detachWebView()
        }
    }
}

/**
 * Check if URL should be opened externally
 */
private fun isExternalUrl(url: String): Boolean {
    val allowedHosts = listOf(
        "amgeljodi.com",
        "www.amgeljodi.com",
        "app.amgeljodi.com",
        "localhost",
        "10.0.2.2"
    )

    return try {
        val uri = android.net.Uri.parse(url)
        val host = uri.host ?: return true

        // Check if host is in allowed list
        !allowedHosts.any { allowed ->
            host == allowed || host.endsWith(".$allowed")
        }
    } catch (e: Exception) {
        true
    }
}
