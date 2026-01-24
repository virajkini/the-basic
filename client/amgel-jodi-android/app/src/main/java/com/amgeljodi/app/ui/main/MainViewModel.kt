package com.amgeljodi.app.ui.main

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.amgeljodi.app.data.preferences.AppPreferences
import com.amgeljodi.app.data.repository.ImageData
import com.amgeljodi.app.data.repository.ImageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

/**
 * ViewModel for the main screen
 * Handles preferences, image processing, and network state
 */
@HiltViewModel
class MainViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val appPreferences: AppPreferences,
    private val imageRepository: ImageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        // Load preferences
        viewModelScope.launch {
            appPreferences.useDebugUrl.collect { useDebug ->
                _uiState.update { it.copy(useDebugUrl = useDebug) }
            }
        }
    }

    /**
     * Toggle debug URL usage
     */
    suspend fun setUseDebugUrl(enabled: Boolean) {
        appPreferences.setUseDebugUrl(enabled)
    }

    /**
     * Save last visited URL for state restoration
     */
    suspend fun saveLastVisitedUrl(url: String) {
        appPreferences.setLastVisitedUrl(url)
    }

    /**
     * Create temporary file for camera capture
     */
    fun createImageFile(): Pair<File, Uri> {
        return imageRepository.createImageFile()
    }

    /**
     * Process selected images and convert to base64
     */
    fun processImages(uris: List<Uri>) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessingImages = true) }

            val results = imageRepository.processImages(uris)
            val successfulImages = results
                .filter { it.isSuccess }
                .mapNotNull { it.getOrNull() }
                .map { imageData ->
                    mapOf(
                        "base64" to "data:${imageData.mimeType};base64,${imageData.base64}",
                        "width" to imageData.width,
                        "height" to imageData.height
                    )
                }

            _uiState.update {
                it.copy(
                    isProcessingImages = false,
                    processedImages = successfulImages
                )
            }
        }
    }

    /**
     * Clear processed images after sending to web
     */
    fun clearProcessedImages() {
        _uiState.update { it.copy(processedImages = emptyList()) }
    }

    /**
     * Check if network is available
     */
    fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false

        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    override fun onCleared() {
        super.onCleared()
        // Clean up temporary files
        imageRepository.cleanupTempFiles()
    }
}

/**
 * UI state for main screen
 */
data class MainUiState(
    val useDebugUrl: Boolean = false,
    val isProcessingImages: Boolean = false,
    val processedImages: List<Map<String, Any>> = emptyList()
)
