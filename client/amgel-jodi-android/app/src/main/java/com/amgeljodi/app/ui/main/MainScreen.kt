package com.amgeljodi.app.ui.main

import android.Manifest
import android.net.Uri
import android.os.Build
import android.webkit.WebChromeClient
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import com.amgeljodi.app.bridge.BridgeEvent
import com.amgeljodi.app.bridge.WebViewBridge
import com.amgeljodi.app.ui.components.DebugSettingsSheet
import com.amgeljodi.app.ui.components.ErrorScreen
import com.amgeljodi.app.ui.components.LoadingOverlay
import com.amgeljodi.app.ui.webview.AmgelJodiWebView
import com.amgeljodi.app.ui.webview.rememberWebViewState
import com.amgeljodi.app.util.BiometricHelper
import com.amgeljodi.app.util.Constants
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import kotlinx.coroutines.launch
import java.io.File

/**
 * Main screen containing the WebView and handling native interactions
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun MainScreen(
    baseUrl: String,
    webViewBridge: WebViewBridge,
    viewModel: MainViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val activity = context as? FragmentActivity
    val scope = rememberCoroutineScope()

    val webViewState = rememberWebViewState()
    val uiState by viewModel.uiState.collectAsState()

    // Handle back button - trigger history.back() for SPA navigation
    BackHandler(enabled = webViewState.canGoBack) {
        webViewState.goBack()
    }

    var showDebugSettings by remember { mutableStateOf(false) }
    var pendingFileChooserParams by remember { mutableStateOf<WebChromeClient.FileChooserParams?>(null) }
    var tempCameraFile by remember { mutableStateOf<File?>(null) }
    var tempCameraUri by remember { mutableStateOf<Uri?>(null) }

    val biometricHelper = remember { BiometricHelper(context) }
    val sheetState = rememberModalBottomSheetState()

    // Permission states
    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)

    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        if (uris.isNotEmpty()) {
            viewModel.processImages(uris)
        }
    }

    // Camera launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && tempCameraUri != null) {
            viewModel.processImages(listOf(tempCameraUri!!))
        }
    }

    // Camera permission launcher
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            // Launch camera after permission granted
            val (file, uri) = viewModel.createImageFile()
            tempCameraFile = file
            tempCameraUri = uri
            cameraLauncher.launch(uri)
        }
    }

    // Handle bridge events
    LaunchedEffect(Unit) {
        webViewBridge.bridgeEvents.collect { event ->
            when (event) {
                is BridgeEvent.PickImages -> {
                    imagePickerLauncher.launch("image/*")
                }

                is BridgeEvent.TakePhoto -> {
                    if (cameraPermission.status.isGranted) {
                        val (file, uri) = viewModel.createImageFile()
                        tempCameraFile = file
                        tempCameraUri = uri
                        cameraLauncher.launch(uri)
                    } else {
                        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    }
                }

                is BridgeEvent.CheckBiometric -> {
                    val status = biometricHelper.isBiometricAvailable()
                    webViewBridge.sendToWeb("biometricStatus", mapOf(
                        "available" to (status == com.amgeljodi.app.util.BiometricStatus.Available),
                        "status" to status.name
                    ))
                }

                is BridgeEvent.AuthenticateBiometric -> {
                    activity?.let { act ->
                        biometricHelper.authenticate(
                            activity = act,
                            onSuccess = {
                                webViewBridge.sendToWeb("biometricResult", mapOf("success" to true))
                            },
                            onError = { error ->
                                webViewBridge.sendToWeb("biometricResult", mapOf(
                                    "success" to false,
                                    "error" to error
                                ))
                            },
                            onFailed = {
                                webViewBridge.sendToWeb("biometricResult", mapOf(
                                    "success" to false,
                                    "error" to "Authentication failed"
                                ))
                            }
                        )
                    }
                }
            }
        }
    }

    // Handle processed images
    LaunchedEffect(uiState.processedImages) {
        if (uiState.processedImages.isNotEmpty()) {
            webViewBridge.sendToWeb("imagesSelected", uiState.processedImages)
            viewModel.clearProcessedImages()
        }
    }

    // UI - Light background with safe area padding
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .windowInsetsPadding(WindowInsets.statusBars)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Progress indicator
            LoadingOverlay(
                progress = webViewState.progress,
                modifier = Modifier.fillMaxWidth()
            )

            // WebView or Error
            Box(modifier = Modifier.weight(1f)) {
                if (webViewState.hasError) {
                    ErrorScreen(
                        isOffline = !viewModel.isNetworkAvailable(),
                        errorMessage = webViewState.errorMessage,
                        onRetry = { webViewState.reload() }
                    )
                } else {
                    AmgelJodiWebView(
                        url = if (uiState.useDebugUrl) Constants.Urls.DEBUG else baseUrl,
                        webViewBridge = webViewBridge,
                        state = webViewState,
                        onPageFinished = { url ->
                            scope.launch {
                                viewModel.saveLastVisitedUrl(url)
                            }
                        },
                        onFileUploadRequest = { params ->
                            pendingFileChooserParams = params
                            imagePickerLauncher.launch("image/*")
                        }
                    )
                }

                // Loading indicator
                androidx.compose.animation.AnimatedVisibility(
                    visible = webViewState.isLoading && webViewState.progress < 50,
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.background.copy(alpha = 0.9f)),
                        contentAlignment = Alignment.Center
                    ) {
                        androidx.compose.material3.CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        // Debug FAB (only in debug builds)
        if (Constants.Urls.ALLOW_TOGGLE) {
            FloatingActionButton(
                onClick = { showDebugSettings = true },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                containerColor = MaterialTheme.colorScheme.secondaryContainer
            ) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Debug Settings"
                )
            }
        }
    }

    // Debug settings bottom sheet
    if (showDebugSettings) {
        ModalBottomSheet(
            onDismissRequest = { showDebugSettings = false },
            sheetState = sheetState
        ) {
            DebugSettingsSheet(
                useDebugUrl = uiState.useDebugUrl,
                currentUrl = webViewState.currentUrl ?: baseUrl,
                onToggleDebugUrl = { enabled ->
                    scope.launch {
                        viewModel.setUseDebugUrl(enabled)
                        webViewState.reload()
                    }
                },
                onReload = {
                    webViewState.reload()
                    showDebugSettings = false
                },
                onClearData = {
                    webViewState.webView?.clearCache(true)
                    webViewState.webView?.clearHistory()
                    webViewState.reload()
                    showDebugSettings = false
                }
            )
        }
    }
}
