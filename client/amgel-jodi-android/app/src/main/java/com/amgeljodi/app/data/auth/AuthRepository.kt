package com.amgeljodi.app.data.auth

import android.webkit.CookieManager
import com.amgeljodi.app.util.Constants
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

        return try {
            val response = execute(
                Request.Builder()
                    .url("${Constants.Urls.API}/auth/me")
                    .get()
                    .header("Accept", "application/json")
                    .header("Cookie", cookieHeader(token))
                    .build()
            )

            response.use { res ->
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

        return try {
            val response = execute(
                Request.Builder()
                    .url("${Constants.Urls.API}/auth/otp/login")
                    .post(jsonBody(mapOf("phone" to phone)))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .build()
            )

            response.use { res ->
                val body = res.body?.string().orEmpty()
                if (!res.isSuccessful) {
                    return AuthActionResult.Error(extractErrorMessage(body))
                }

                val token = extractAccessToken(res.headers.values("Set-Cookie"))
                    ?: return AuthActionResult.Error("We couldn't save your session. Please try again.")

                persistSession(token)
                AuthActionResult.Success
            }
        } catch (_: Exception) {
            AuthActionResult.Error("Couldn't complete login right now. Please try again.")
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
    ): AuthActionResult {
        return try {
            val response = execute(
                Request.Builder()
                    .url("${Constants.Urls.API}$path")
                    .post(jsonBody(payload))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .build()
            )

            response.use { res ->
                val body = res.body?.string().orEmpty()
                if (res.isSuccessful) {
                    AuthActionResult.Success
                } else {
                    AuthActionResult.Error(extractErrorMessage(body))
                }
            }
how         } catch (_: Exception) {
            AuthActionResult.Error("Network looks unstable. Please try again.")
        }
    }

    private suspend fun persistSession(token: String) {
        secureSessionStore.saveAccessToken(token)
        syncCookies(token)
    }

    private suspend fun syncCookies(token: String) {
        withContext(Dispatchers.Main) {
            val cookie = buildCookie(token)
            val cookieManager = CookieManager.getInstance()
            cookieManager.setAcceptCookie(true)
            cookieManager.setCookie(Constants.Urls.API, cookie)
            cookieManager.setCookie(Constants.Urls.PRODUCTION, cookie)
            cookieManager.setCookie(Constants.Urls.HOME, cookie)
            cookieManager.setCookie("https://amgeljodi.com", cookie)
            cookieManager.setCookie("https://stage.amgeljodi.com", cookie)
            cookieManager.flush()
        }
    }

    private fun buildCookie(token: String): String {
        return "${Constants.Auth.ACCESS_TOKEN_COOKIE}=$token; Path=/; Domain=.amgeljodi.com; Secure; HttpOnly; SameSite=Lax"
    }

    private fun cookieHeader(token: String): String = "${Constants.Auth.ACCESS_TOKEN_COOKIE}=$token"

    private fun extractAccessToken(setCookies: List<String>): String? {
        val regex = Regex("""(?:^|\\s)${Constants.Auth.ACCESS_TOKEN_COOKIE}=([^;]+)""")
        return setCookies.firstNotNullOfOrNull { cookie ->
            regex.find(cookie)?.groupValues?.getOrNull(1)
        }
    }

    private suspend fun execute(request: Request) = withContext(Dispatchers.IO) {
        client.newCall(request).execute()
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
