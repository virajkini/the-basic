package com.amgeljodi.app.ui.root

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.amgeljodi.app.bridge.WebViewBridge
import com.amgeljodi.app.ui.auth.LandingScreen
import com.amgeljodi.app.ui.auth.LoginErrorScreen
import com.amgeljodi.app.ui.auth.OtpScreen
import com.amgeljodi.app.ui.auth.PhoneEntryScreen
import com.amgeljodi.app.ui.main.MainScreen
import com.amgeljodi.app.util.Constants

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppEntryScreen(
    webViewBridge: WebViewBridge,
    deepLinkUrl: String?,
    viewModel: AppEntryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val webUrl = deepLinkUrl ?: uiState.postLoginUrl
    val loginSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    BackHandler(enabled = uiState.route == AppRoute.PhoneEntry || uiState.route == AppRoute.OtpEntry) {
        when (uiState.route) {
            AppRoute.OtpEntry -> viewModel.editPhoneNumber()
            AppRoute.PhoneEntry -> viewModel.goBackToLanding()
            else -> Unit
        }
    }

    BackHandler(enabled = uiState.route == AppRoute.WebView && uiState.webViewMode == WebViewMode.Public) {
        viewModel.closePublicWebView()
    }

    AnimatedContent(
        targetState = uiState.route,
        transitionSpec = { fadeIn() togetherWith fadeOut() },
        modifier = Modifier.fillMaxSize(),
        label = "app-entry"
    ) { route ->
        when (route) {
            AppRoute.Splash -> SplashLoadingScreen()
            AppRoute.BootstrapError -> LoginErrorScreen(
                title = "Couldn't restore your session",
                message = uiState.errorMessage ?: "Please try again.",
                actionLabel = "Try again",
                onAction = viewModel::bootstrap
            )
            AppRoute.Landing,
            AppRoute.PhoneEntry,
            AppRoute.OtpEntry -> Box(modifier = Modifier.fillMaxSize()) {
                LandingScreen(
                    onPrimaryAction = viewModel::openLogin,
                    message = uiState.infoMessage,
                    onLinkClick = { slug ->
                        when (slug) {
                            "login" -> viewModel.openLogin()
                            "about" -> viewModel.openPublicLink("${Constants.Urls.HOME}/about")
                            "contact" -> viewModel.openPublicLink("${Constants.Urls.HOME}/contact")
                            "privacy" -> viewModel.openPublicLink("${Constants.Urls.HOME}/privacy")
                            "terms" -> viewModel.openPublicLink("${Constants.Urls.HOME}/terms")
                            "child-safety" -> viewModel.openPublicLink("${Constants.Urls.HOME}/child-safety")
                        }
                    }
                )

                if (route == AppRoute.PhoneEntry || route == AppRoute.OtpEntry) {
                    ModalBottomSheet(
                        onDismissRequest = viewModel::goBackToLanding,
                        sheetState = loginSheetState,
                        containerColor = MaterialTheme.colorScheme.surface,
                        contentColor = MaterialTheme.colorScheme.onSurface
                    ) {
                        when (route) {
                            AppRoute.PhoneEntry -> PhoneEntryScreen(
                                countries = AppEntryViewModel.supportedCountries,
                                selectedCountry = uiState.selectedCountry,
                                phone = uiState.phone,
                                isLoading = uiState.isLoading,
                                errorMessage = uiState.errorMessage,
                                sheetMode = true,
                                onCountrySelected = viewModel::onCountrySelected,
                                onPhoneChanged = viewModel::onPhoneChanged,
                                onContinue = viewModel::sendOtp
                            )

                            AppRoute.OtpEntry -> OtpScreen(
                                country = uiState.selectedCountry,
                                phone = uiState.phone,
                                otp = uiState.otp,
                                resendCooldownSeconds = uiState.resendCooldownSeconds,
                                isLoading = uiState.isLoading,
                                errorMessage = uiState.errorMessage,
                                infoMessage = uiState.infoMessage,
                                sheetMode = true,
                                onOtpChanged = viewModel::onOtpChanged,
                                onVerify = viewModel::verifyOtp,
                                onResend = viewModel::resendOtp,
                                onChangeNumber = viewModel::editPhoneNumber
                            )

                            else -> Unit
                        }
                    }
                }
            }
            AppRoute.WebView -> MainScreen(
                baseUrl = webUrl,
                webViewBridge = webViewBridge,
                onAuthLost = if (uiState.webViewMode == WebViewMode.Authenticated) viewModel::onWebAuthLost else null,
                onExitRequested = if (uiState.webViewMode == WebViewMode.Public) viewModel::closePublicWebView else null
            )
        }
    }

    AnimatedVisibility(
        visible = uiState.isLoading && uiState.route != AppRoute.WebView,
        enter = fadeIn(),
        exit = fadeOut()
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background.copy(alpha = 0.6f))
                .systemBarsPadding(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(
                modifier = Modifier.padding(24.dp),
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
private fun SplashLoadingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .systemBarsPadding(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
    }
}
