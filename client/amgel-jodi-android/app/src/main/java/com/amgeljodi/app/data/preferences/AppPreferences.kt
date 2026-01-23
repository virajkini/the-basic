package com.amgeljodi.app.data.preferences

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.amgeljodi.app.util.Constants
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * DataStore-based preferences manager for app settings
 */
@Singleton
class AppPreferences @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private val USE_DEBUG_URL = booleanPreferencesKey(Constants.Preferences.USE_DEBUG_URL)
        private val BIOMETRIC_ENABLED = booleanPreferencesKey(Constants.Preferences.BIOMETRIC_ENABLED)
        private val LAST_VISITED_URL = stringPreferencesKey(Constants.Preferences.LAST_VISITED_URL)
    }

    // Debug URL toggle
    val useDebugUrl: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[USE_DEBUG_URL] ?: false
    }

    suspend fun setUseDebugUrl(value: Boolean) {
        dataStore.edit { prefs ->
            prefs[USE_DEBUG_URL] = value
        }
    }

    // Biometric authentication
    val biometricEnabled: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[BIOMETRIC_ENABLED] ?: false
    }

    suspend fun setBiometricEnabled(value: Boolean) {
        dataStore.edit { prefs ->
            prefs[BIOMETRIC_ENABLED] = value
        }
    }

    // Last visited URL (for restoring state)
    val lastVisitedUrl: Flow<String?> = dataStore.data.map { prefs ->
        prefs[LAST_VISITED_URL]
    }

    suspend fun setLastVisitedUrl(url: String) {
        dataStore.edit { prefs ->
            prefs[LAST_VISITED_URL] = url
        }
    }

    // Clear all preferences
    suspend fun clearAll() {
        dataStore.edit { prefs ->
            prefs.clear()
        }
    }
}
