package com.amgeljodi.app

import android.app.Application
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import dagger.hilt.android.HiltAndroidApp

/**
 * Main Application class for Amgel Jodi
 * Initializes Hilt dependency injection
 */
@HiltAndroidApp
class AmgelJodiApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val config = PostHogAndroidConfig(
            apiKey = BuildConfig.POSTHOG_API_KEY,
            host = BuildConfig.POSTHOG_HOST
        )
        PostHogAndroid.setup(this, config)
    }
}
