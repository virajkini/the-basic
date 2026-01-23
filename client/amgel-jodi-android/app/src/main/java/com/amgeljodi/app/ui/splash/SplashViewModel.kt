package com.amgeljodi.app.ui.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amgeljodi.app.data.preferences.AppPreferences
import com.amgeljodi.app.util.Constants
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for splash screen
 * Handles initialization and determines next screen
 */
@HiltViewModel
class SplashViewModel @Inject constructor(
    private val appPreferences: AppPreferences
) : ViewModel() {

    private val _splashState = MutableStateFlow<SplashState>(SplashState.Loading)
    val splashState: StateFlow<SplashState> = _splashState.asStateFlow()

    private val _baseUrl = MutableStateFlow(Constants.Urls.PRODUCTION)
    val baseUrl: StateFlow<String> = _baseUrl.asStateFlow()

    init {
        initialize()
    }

    private fun initialize() {
        viewModelScope.launch {
            // Determine which URL to use
            val useDebug = appPreferences.useDebugUrl.first()
            _baseUrl.value = if (useDebug && Constants.Urls.ALLOW_TOGGLE) {
                Constants.Urls.DEBUG
            } else {
                Constants.Urls.PRODUCTION
            }

            // Check if biometric is enabled
            val biometricEnabled = appPreferences.biometricEnabled.first()

            // Minimum splash display time for branding
            delay(Constants.Timeouts.SPLASH_DELAY_MS)

            _splashState.value = if (biometricEnabled) {
                SplashState.RequiresBiometric
            } else {
                SplashState.Ready
            }
        }
    }

    fun onBiometricSuccess() {
        _splashState.value = SplashState.Ready
    }

    fun onBiometricFailed() {
        // Allow retry or skip to main (with limited functionality)
        _splashState.value = SplashState.Ready
    }
}

/**
 * Possible states of the splash screen
 */
sealed class SplashState {
    data object Loading : SplashState()
    data object RequiresBiometric : SplashState()
    data object Ready : SplashState()
}
