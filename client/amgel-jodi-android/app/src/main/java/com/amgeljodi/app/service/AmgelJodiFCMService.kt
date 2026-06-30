package com.amgeljodi.app.service

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import com.amgeljodi.app.data.preferences.AppPreferences
import com.amgeljodi.app.data.repository.FcmTokenRepository
import com.amgeljodi.app.util.NotificationHelper
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.posthog.PostHog
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import javax.inject.Inject

@AndroidEntryPoint
class AmgelJodiFCMService : FirebaseMessagingService() {

    @Inject lateinit var fcmTokenRepository: FcmTokenRepository
    @Inject lateinit var appPreferences: AppPreferences
    @Inject lateinit var httpClient: OkHttpClient

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onNewToken(token: String) {
        Log.d(TAG, "FCM token refreshed")
        serviceScope.launch {
            appPreferences.setFcmToken(token)
            val registered = fcmTokenRepository.registerToken(token)
            if (registered) {
                PostHog.capture(event = "fcm_token_registered")
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"] ?: return
        val body = message.notification?.body ?: message.data["body"] ?: return
        val deepLink = message.data["deepLink"]
        val channelId = message.data["channelId"] ?: NotificationHelper.CHANNEL_CONNECTIONS
        val notificationId = message.data["notificationId"]?.hashCode() ?: System.currentTimeMillis().toInt()
        val imageUrl = message.data["imageUrl"] ?: message.notification?.imageUrl?.toString()

        val imageBitmap = imageUrl?.let { downloadBitmap(it) }

        NotificationHelper.showNotification(
            context = applicationContext,
            title = title,
            body = body,
            deepLink = deepLink,
            channelId = channelId,
            notificationId = notificationId,
            imageBitmap = imageBitmap
        )
    }

    private fun downloadBitmap(url: String): Bitmap? = try {
        val request = Request.Builder().url(url).build()
        httpClient.newCall(request).execute().use { response ->
            response.body?.bytes()?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
        }
    } catch (e: Exception) {
        Log.w(TAG, "Failed to download notification image: $url", e)
        null
    }

    companion object {
        private const val TAG = "AmgelJodiFCMService"
    }
}
