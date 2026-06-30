package com.amgeljodi.app

import android.app.Application
import com.amgeljodi.app.data.preferences.AppPreferences
import com.amgeljodi.app.data.repository.FcmTokenRepository
import com.amgeljodi.app.util.NotificationHelper
import com.google.firebase.messaging.FirebaseMessaging
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class AmgelJodiApp : Application() {

    @Inject lateinit var fcmTokenRepository: FcmTokenRepository
    @Inject lateinit var appPreferences: AppPreferences

    private val appScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onCreate() {
        super.onCreate()

        val config = PostHogAndroidConfig(
            apiKey = BuildConfig.POSTHOG_API_KEY,
            host = BuildConfig.POSTHOG_HOST
        )
        PostHogAndroid.setup(this, config)

        NotificationHelper.createNotificationChannels(this)

        // Register FCM token with server if user is authenticated
        appScope.launch {
            FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
                appScope.launch {
                    appPreferences.setFcmToken(token)
                    val registered = fcmTokenRepository.registerToken(token)
                    if (registered) {
                        PostHog.capture(event = "fcm_token_registered")
                    }
                }
            }
        }
    }
}
