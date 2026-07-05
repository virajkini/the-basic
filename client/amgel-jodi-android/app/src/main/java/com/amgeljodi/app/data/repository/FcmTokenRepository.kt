package com.amgeljodi.app.data.repository

import android.util.Log
import android.webkit.CookieManager
import com.amgeljodi.app.data.auth.SecureSessionStore
import com.amgeljodi.app.util.Constants
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FcmTokenRepository @Inject constructor(
    private val client: OkHttpClient,
    private val gson: Gson,
    private val secureSessionStore: SecureSessionStore
) {
    suspend fun registerToken(token: String): Boolean = withContext(Dispatchers.IO) {
        val accessToken = secureSessionStore.getAccessToken() ?: return@withContext false

        try {
            val body = gson.toJson(mapOf("token" to token))
                .toRequestBody("application/json".toMediaType())

            val cookie = "${Constants.Auth.ACCESS_TOKEN_COOKIE}=$accessToken"
            val request = Request.Builder()
                .url("${Constants.Urls.API}/notifications/fcm-token")
                .post(body)
                .header("Content-Type", "application/json")
                .header("Cookie", cookie)
                .build()

            client.newCall(request).execute().use { res ->
                if (res.isSuccessful) {
                    Log.d(TAG, "FCM token registered successfully")
                    true
                } else {
                    Log.w(TAG, "FCM token registration failed: ${res.code}")
                    false
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "FCM token registration error", e)
            false
        }
    }

    companion object {
        private const val TAG = "FcmTokenRepository"
    }
}
