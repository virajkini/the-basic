package com.amgeljodi.app.data.auth

import android.content.Context
import android.util.Log
import android.webkit.CookieManager
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.amgeljodi.app.BuildConfig
import com.amgeljodi.app.util.Constants
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val client: OkHttpClient,
    private val gson: Gson,
    private val secureSessionStore: SecureSessionStore
) {
    suspend fun bootstrapSession(): AuthBootstrapResult {
        val token = secureSessionStore.getAccessToken() ?: return AuthBootstrapResult.LoggedOut
        syncCookies(token)

        return withContext(Dispatchers.IO) {
            try {
                client.newCall(
                    Request.Builder()
                        .url("${Constants.Urls.API}/auth/me")
                        .get()
                        .header("Accept", "application/json")
                        .header("Cookie", cookieHeader(token))
                        .build()
                ).execute().use { res ->
                    val body = res.body?.string().orEmpty()
                    when {
                        res.isSuccessful -> {
                            extractAccessToken(res.headers.values("Set-Cookie"))?.let { refreshedToken ->
                                persistSession(refreshedToken)
                            }

                            val json = parseJson(body)
                            val loggedIn = json?.get("loggedIn")?.asBoolean == true
                            if (loggedIn) {
                                AuthBootstrapResult.Authenticated
                            } else {
                                clearSession()
                                AuthBootstrapResult.LoggedOut
                            }
                        }

                        res.code == 401 -> {
                            clearSession()
                            AuthBootstrapResult.LoggedOut
                        }

                        else -> AuthBootstrapResult.Error(extractErrorMessage(body))
                    }
                }
            } catch (_: Exception) {
                AuthBootstrapResult.UseStoredSession
            }
        }
    }

    suspend fun sendOtp(phone: String): AuthActionResult {
        return postWithoutSession("/otp/send", mapOf("phone" to phone))
    }

    suspend fun resendOtp(phone: String): AuthActionResult {
        return postWithoutSession("/otp/resend", mapOf("phone" to phone))
    }

    suspend fun verifyOtpAndCreateSession(phone: String, otp: String): AuthActionResult {
        val verifyResult = postWithoutSession("/otp/verify", mapOf("phone" to phone, "otp" to otp))
        if (verifyResult !is AuthActionResult.Success) {
            return verifyResult
        }

        return withContext(Dispatchers.IO) {
            try {
                client.newCall(
                    Request.Builder()
                        .url("${Constants.Urls.API}/auth/otp/login")
                        .post(jsonBody(mapOf("phone" to phone)))
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .build()
                ).execute().use { res ->
                    val body = res.body?.string().orEmpty()
                    if (!res.isSuccessful) {
                        return@withContext AuthActionResult.Error(extractErrorMessage(body))
                    }

                    val token = extractAccessToken(res.headers.values("Set-Cookie"))
                        ?: return@withContext AuthActionResult.Error("We couldn't save your session. Please try again.")

                    persistSession(token)
                    AuthActionResult.Success
                }
            } catch (e: Exception) {
                Log.e(TAG, "OTP login failed for $phone", e)
                AuthActionResult.Error("Couldn't complete login right now. Please try again.")
            }
        }
    }

    suspend fun signInWithGoogle(context: Context): AuthActionResult {
        if (BuildConfig.GOOGLE_WEB_CLIENT_ID.isBlank()) {
            return AuthActionResult.Error("Google Sign-In is not configured.")
        }

        val credentialManager = CredentialManager.create(context)
        val signInOption = GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_WEB_CLIENT_ID).build()
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(signInOption)
            .build()

        val idToken = try {
            val result = credentialManager.getCredential(context, request)
            GoogleIdTokenCredential.createFrom(result.credential.data).idToken
        } catch (e: GetCredentialException) {
            Log.e(TAG, "Google credential failed", e)
            return AuthActionResult.Error("Google Sign-In was cancelled or failed. Please try again.")
        } catch (e: Exception) {
            Log.e(TAG, "Google sign-in unexpected error", e)
            return AuthActionResult.Error("Google Sign-In failed. Please try again.")
        }

        return withContext(Dispatchers.IO) {
            try {
                client.newCall(
                    Request.Builder()
                        .url("${Constants.Urls.API}/auth/google")
                        .post(jsonBody(mapOf("idToken" to idToken)))
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .build()
                ).execute().use { res ->
                    val body = res.body?.string().orEmpty()
                    if (!res.isSuccessful) {
                        return@withContext AuthActionResult.Error(extractErrorMessage(body))
                    }
                    val token = extractAccessToken(res.headers.values("Set-Cookie"))
                        ?: return@withContext AuthActionResult.Error("Session could not be saved. Please try again.")
                    persistSession(token)
                    AuthActionResult.Success
                }
            } catch (e: Exception) {
                Log.e(TAG, "Google auth API call failed", e)
                AuthActionResult.Error("Couldn't complete login. Please try again.")
            }
        }
    }

    suspend fun clearSession() {
        secureSessionStore.clear()
        withContext(Dispatchers.Main) {
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
        }
    }

    suspend fun syncStoredSessionToWebView() {
        secureSessionStore.getAccessToken()?.let { syncCookies(it) }
    }

    private suspend fun postWithoutSession(
        path: String,
        payload: Map<String, String>
    ): AuthActionResult = withContext(Dispatchers.IO) {
        try {
            client.newCall(
                Request.Builder()
                    .url("${Constants.Urls.API}$path")
                    .post(jsonBody(payload))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .build()
            ).execute().use { res ->
                val body = res.body?.string().orEmpty()
                if (res.isSuccessful) {
                    AuthActionResult.Success
                } else {
                    AuthActionResult.Error(extractErrorMessage(body))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "OTP request failed: $path", e)
            AuthActionResult.Error("Network looks unstable. Please try again.")
        }
    }

    private suspend fun persistSession(token: String) {
        secureSessionStore.saveAccessToken(token)
        syncCookies(token)
    }

    private suspend fun syncCookies(token: String) {
        withContext(Dispatchers.Main) {
            val cookieManager = CookieManager.getInstance()
            cookieManager.setAcceptCookie(true)

            // Production: Domain=.amgeljodi.com covers all subdomains (app, api, www)
            cookieManager.setCookie("https://app.amgeljodi.com", buildCookie(token))

            // Local dev (debug builds only — ALLOW_TOGGLE is false in release)
            if (Constants.Urls.ALLOW_TOGGLE && Constants.Urls.DEBUG.startsWith("http://localhost")) {
                val local = buildLocalCookie(token)
                cookieManager.setCookie(Constants.Urls.DEBUG, local)
                // Only set API cookie if it's also pointing at localhost
                if (Constants.Urls.API.startsWith("http://localhost")) {
                    cookieManager.setCookie(Constants.Urls.API, local)
                }
            }

            cookieManager.flush()
        }
    }

    private fun buildCookie(token: String): String {
        return "${Constants.Auth.ACCESS_TOKEN_COOKIE}=$token; Path=/; Domain=.amgeljodi.com; Secure; HttpOnly; SameSite=Lax"
    }

    private fun buildLocalCookie(token: String): String {
        return "${Constants.Auth.ACCESS_TOKEN_COOKIE}=$token; Path=/"
    }

    private fun cookieHeader(token: String): String = "${Constants.Auth.ACCESS_TOKEN_COOKIE}=$token"

    private fun extractAccessToken(setCookies: List<String>): String? {
        val regex = Regex("""(?:^|\\s)${Constants.Auth.ACCESS_TOKEN_COOKIE}=([^;]+)""")
        return setCookies.firstNotNullOfOrNull { cookie ->
            regex.find(cookie)?.groupValues?.getOrNull(1)
        }
    }

    private fun jsonBody(payload: Map<String, String>) = gson.toJson(payload)
        .toRequestBody("application/json".toMediaType())

    private fun parseJson(body: String): JsonObject? = runCatching {
        gson.fromJson(body, JsonObject::class.java)
    }.getOrNull()

    private fun extractErrorMessage(body: String): String {
        val json = parseJson(body)
        return listOf("message", "error", "details")
            .firstNotNullOfOrNull { key ->
                json?.get(key)?.takeIf { !it.isJsonNull }?.asString
            }
            ?: "Something went wrong. Please try again."
    }

    companion object {
        private const val TAG = "AuthRepository"
    }
}

sealed interface AuthBootstrapResult {
    data object Authenticated : AuthBootstrapResult
    data object LoggedOut : AuthBootstrapResult
    data object UseStoredSession : AuthBootstrapResult
    data class Error(val message: String) : AuthBootstrapResult
}

sealed interface AuthActionResult {
    data object Success : AuthActionResult
    data class Error(val message: String) : AuthActionResult
}
