package com.amgeljodi.app.ui.root

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amgeljodi.app.data.auth.AuthActionResult
import com.amgeljodi.app.data.auth.AuthBootstrapResult
import com.amgeljodi.app.data.auth.AuthRepository
import com.amgeljodi.app.data.preferences.AppPreferences
import com.amgeljodi.app.util.Constants
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AppEntryViewModel @Inject constructor(
    private val appPreferences: AppPreferences,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AppEntryUiState())
    val uiState: StateFlow<AppEntryUiState> = _uiState.asStateFlow()

    private var resendJob: Job? = null

    init {
        bootstrap()
    }

    fun bootstrap() {
        resendJob?.cancel()

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    route = AppRoute.Splash,
                    errorMessage = null,
                    infoMessage = null,
                    otp = ""
                )
            }

            val useDebug = appPreferences.useDebugUrl.first()
            val targetUrl = if (useDebug && Constants.Urls.ALLOW_TOGGLE) {
                Constants.Urls.DEBUG
            } else {
                Constants.Urls.PRODUCTION
            }

            delay(Constants.Timeouts.SPLASH_DELAY_MS)

            when (val result = authRepository.bootstrapSession()) {
                is AuthBootstrapResult.Authenticated -> {
                    _uiState.update {
                        it.copy(route = AppRoute.WebView, postLoginUrl = targetUrl, webViewMode = WebViewMode.Authenticated)
                    }
                }

                is AuthBootstrapResult.LoggedOut -> {
                    _uiState.update {
                        it.copy(route = AppRoute.Landing, postLoginUrl = targetUrl)
                    }
                }

                is AuthBootstrapResult.UseStoredSession -> {
                    _uiState.update {
                        it.copy(route = AppRoute.WebView, postLoginUrl = targetUrl, webViewMode = WebViewMode.Authenticated)
                    }
                }

                is AuthBootstrapResult.Error -> {
                    _uiState.update {
                        it.copy(
                            route = AppRoute.BootstrapError,
                            postLoginUrl = targetUrl,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun openLogin() {
        _uiState.update {
            it.copy(
                route = AppRoute.PhoneEntry,
                errorMessage = null,
                infoMessage = null
            )
        }
    }

    fun goBackToLanding() {
        resendJob?.cancel()
        _uiState.update {
            it.copy(
                route = AppRoute.Landing,
                otp = "",
                resendCooldownSeconds = 0,
                isLoading = false,
                errorMessage = null,
                infoMessage = null
            )
        }
    }

    fun onPhoneChanged(phone: String) {
        val digits = phone.filter(Char::isDigit).take(14)
        _uiState.update {
            it.copy(phone = digits, errorMessage = null)
        }
    }

    fun onCountrySelected(code: String) {
        val country = supportedCountries.firstOrNull { it.code == code } ?: return
        _uiState.update {
            it.copy(
                selectedCountry = country,
                errorMessage = null
            )
        }
    }

    fun onOtpChanged(otp: String) {
        val digits = otp.filter(Char::isDigit).take(Constants.Auth.OTP_MAX_LENGTH)
        _uiState.update {
            it.copy(otp = digits, errorMessage = null)
        }
    }

    fun sendOtp() {
        val state = uiState.value
        val localPhone = state.phone
        if (localPhone.length !in 6..14) {
            _uiState.update { it.copy(errorMessage = "Enter a valid mobile number.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, infoMessage = null) }
            when (val result = authRepository.sendOtp(formatPhone(localPhone, state.selectedCountry))) {
                is AuthActionResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            route = AppRoute.OtpEntry,
                            otp = "",
                            infoMessage = "OTP sent to ${formatDisplayPhone(localPhone, state.selectedCountry)}"
                        )
                    }
                    startResendTimer()
                }

                is AuthActionResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun resendOtp() {
        val state = uiState.value
        val localPhone = state.phone
        if (state.resendCooldownSeconds > 0 || localPhone.length !in 6..14) {
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            when (val result = authRepository.resendOtp(formatPhone(localPhone, state.selectedCountry))) {
                is AuthActionResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            infoMessage = "A fresh OTP is on the way."
                        )
                    }
                    startResendTimer()
                }

                is AuthActionResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun verifyOtp() {
        val state = uiState.value
        if (state.otp.length < Constants.Auth.OTP_MIN_LENGTH) {
            _uiState.update { it.copy(errorMessage = "Enter the OTP to continue.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            when (val result = authRepository.verifyOtpAndCreateSession(formatPhone(state.phone, state.selectedCountry), state.otp)) {
                is AuthActionResult.Success -> {
                    authRepository.syncStoredSessionToWebView()
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            route = AppRoute.WebView,
                            webViewMode = WebViewMode.Authenticated,
                            otp = "",
                            errorMessage = null,
                            infoMessage = null
                        )
                    }
                }

                is AuthActionResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun editPhoneNumber() {
        resendJob?.cancel()
        _uiState.update {
            it.copy(
                route = AppRoute.PhoneEntry,
                otp = "",
                resendCooldownSeconds = 0,
                errorMessage = null,
                infoMessage = null
            )
        }
    }

    fun onWebAuthLost() {
        viewModelScope.launch {
            authRepository.clearSession()
            _uiState.update {
                it.copy(
                    route = AppRoute.Landing,
                    phone = "",
                    otp = "",
                    resendCooldownSeconds = 0,
                    errorMessage = null,
                    infoMessage = "Please sign in again."
                )
            }
        }
    }

    fun openPublicLink(url: String) {
        _uiState.update {
            it.copy(
                route = AppRoute.WebView,
                postLoginUrl = url,
                webViewMode = WebViewMode.Public,
                errorMessage = null
            )
        }
    }

    fun closePublicWebView() {
        _uiState.update {
            it.copy(
                route = AppRoute.Landing,
                postLoginUrl = Constants.Urls.PRODUCTION,
                webViewMode = WebViewMode.Authenticated
            )
        }
    }

    private fun startResendTimer() {
        resendJob?.cancel()
        resendJob = viewModelScope.launch {
            for (remaining in Constants.Auth.RESEND_COOLDOWN_SECONDS downTo 1) {
                _uiState.update { it.copy(resendCooldownSeconds = remaining) }
                delay(1000)
            }
            _uiState.update { it.copy(resendCooldownSeconds = 0) }
        }
    }

    private fun formatPhone(phone: String, country: CountryOption): String = "${country.dialCode}$phone"

    private fun formatDisplayPhone(phone: String, country: CountryOption): String {
        return "+${country.dialCode} $phone"
    }

    companion object {
        val supportedCountries = listOf(
            CountryOption(code = "IN", name = "India", dialCode = "91", flag = "\uD83C\uDDEE\uD83C\uDDF3"),
            CountryOption(code = "US", name = "United States", dialCode = "1", flag = "\uD83C\uDDFA\uD83C\uDDF8"),
            CountryOption(code = "GB", name = "United Kingdom", dialCode = "44", flag = "\uD83C\uDDEC\uD83C\uDDE7")
        )
    }
}

data class AppEntryUiState(
    val route: AppRoute = AppRoute.Splash,
    val postLoginUrl: String = Constants.Urls.PRODUCTION,
    val webViewMode: WebViewMode = WebViewMode.Authenticated,
    val selectedCountry: CountryOption = AppEntryViewModel.supportedCountries.first(),
    val phone: String = "",
    val otp: String = "",
    val resendCooldownSeconds: Int = 0,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val infoMessage: String? = null
)

enum class WebViewMode {
    Authenticated,
    Public
}

data class CountryOption(
    val code: String,
    val name: String,
    val dialCode: String,
    val flag: String
)

enum class AppRoute {
    Splash,
    BootstrapError,
    Landing,
    PhoneEntry,
    OtpEntry,
    WebView
}
