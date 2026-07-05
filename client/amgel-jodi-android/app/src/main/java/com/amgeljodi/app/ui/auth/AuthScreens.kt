package com.amgeljodi.app.ui.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.SignalWifiOff
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.amgeljodi.app.R
import com.amgeljodi.app.util.Constants
import com.amgeljodi.app.ui.root.CountryOption

private val ShellBackground = Color(0xFFF8F2FA)
private val SurfaceDark = Color(0xFFFFFCFF)
private val SurfaceRaised = Color(0xFFF3EAF7)
private val TextPrimary = Color(0xFF2E2332)
private val TextSecondary = Color(0xFF74677A)
private val Gold = Color(0xFFE9C349)
private val Lavender = Color(0xFFE5B4FF)
private val Rose = Color(0xFFB778D8)
private val SoftLilac = Color(0xFFF0DDFC)
private val SoftRose = Color(0xFFFFE8F1)
private val OutlineSoft = Color(0xFFE6D9EA)

@Composable
fun LandingScreen(
    onPrimaryAction: () -> Unit,
    message: String?,
    onLinkClick: (String) -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "landing")
    val drift by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(4200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "drift"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ShellBackground)
            .safeDrawingPadding()
    ) {
        AnimatedBackdrop(progress = drift)

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(
                top = 18.dp,
                bottom = 0.dp
            ),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                    LandingTopBar(onLoginClick = onPrimaryAction)
                }
            }
            item {
                Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                    HeroCard(onPrimaryAction = onPrimaryAction, progress = drift)
                }
            }
            item {
                AnimatedVisibility(
                    visible = !message.isNullOrBlank(),
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    if (!message.isNullOrBlank()) {
                        Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                            StatusPill(text = message)
                        }
                    }
                }
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
                    Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                        TrustSection()
                    }
                    Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                        QuickLinksSection(onLinkClick = onLinkClick)
                    }
                    LandingFooterArt()
                }
            }
        }
    }
}

@Composable
fun PhoneEntryScreen(
    countries: List<CountryOption>,
    selectedCountry: CountryOption,
    phone: String,
    isLoading: Boolean,
    errorMessage: String?,
    sheetMode: Boolean = false,
    onCountrySelected: (String) -> Unit,
    onPhoneChanged: (String) -> Unit,
    onContinue: () -> Unit,
    onGoogleSignIn: (() -> Unit)? = null
) {
    val focusManager = LocalFocusManager.current
    val focusRequester = remember { FocusRequester() }
    val keyboardController = LocalSoftwareKeyboardController.current
    val scrollState = rememberScrollState()

    LaunchedEffect(sheetMode) {
        focusRequester.requestFocus()
        keyboardController?.show()
    }

    AuthContainer(sheetMode = sheetMode) {
        Column(
            modifier = (if (sheetMode) Modifier.fillMaxWidth() else Modifier.fillMaxSize())
                .then(if (sheetMode) Modifier else Modifier.statusBarsPadding().navigationBarsPadding())
                .imePadding()
                .verticalScroll(scrollState)
                .padding(horizontal = 22.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            SectionHeader(
                eyebrow = "OTP login",
                title = "Sign in to continue"
            )

            Card(
                shape = RoundedCornerShape(30.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        countries.forEach { country ->
                            val isSelected = country.code == selectedCountry.code
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(18.dp))
                                    .clickable(enabled = !isLoading) { onCountrySelected(country.code) },
                                shape = RoundedCornerShape(18.dp),
                                color = if (isSelected) SoftLilac else Color.White,
                                border = BorderStroke(
                                    width = 1.dp,
                                    color = if (isSelected) Lavender else OutlineSoft
                                )
                            ) {
                                Text(
                                    text = "${country.flag} +${country.dialCode}",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextPrimary,
                                    textAlign = TextAlign.Center,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 12.dp)
                                )
                            }
                        }
                    }
                    OutlinedTextField(
                        value = phone,
                        onValueChange = onPhoneChanged,
                        modifier = Modifier
                            .fillMaxWidth()
                            .focusRequester(focusRequester),
                        enabled = !isLoading,
                        singleLine = true,
                        shape = RoundedCornerShape(20.dp),
                        textStyle = MaterialTheme.typography.bodyLarge.copy(color = TextPrimary),
                        prefix = {
                            Text(
                                text = "+${selectedCountry.dialCode}",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Phone,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(onDone = {
                            focusManager.clearFocus()
                            onContinue()
                        }),
                        placeholder = {
                            Text(
                                text = "Enter mobile number",
                                style = MaterialTheme.typography.bodyLarge,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White,
                            disabledContainerColor = SurfaceRaised,
                            focusedBorderColor = Lavender,
                            unfocusedBorderColor = OutlineSoft,
                            focusedPlaceholderColor = TextSecondary,
                            unfocusedPlaceholderColor = TextSecondary,
                            cursorColor = Rose
                        ),
                        supportingText = {
                            Text(
                                text = errorMessage ?: "We’ll send a 4-digit OTP for verification.",
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                                color = if (errorMessage != null) MaterialTheme.colorScheme.error else TextSecondary
                            )
                        }
                    )
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            onContinue()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isLoading && phone.length == 10,
                        shape = RoundedCornerShape(20.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Lavender,
                            contentColor = Color(0xFF481865)
                        )
                    ) {
                        Text("Send OTP")
                    }

                    if (onGoogleSignIn != null) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            androidx.compose.material3.HorizontalDivider(
                                modifier = Modifier.weight(1f),
                                color = OutlineSoft
                            )
                            Text(
                                text = "or",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                            androidx.compose.material3.HorizontalDivider(
                                modifier = Modifier.weight(1f),
                                color = OutlineSoft
                            )
                        }

                        androidx.compose.material3.OutlinedButton(
                            onClick = { if (!isLoading) onGoogleSignIn() },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !isLoading,
                            shape = RoundedCornerShape(20.dp),
                            border = BorderStroke(1.dp, OutlineSoft),
                            colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                                contentColor = TextPrimary
                            )
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                GoogleColorIcon()
                                Text("Continue with Google")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GoogleColorIcon() {
    androidx.compose.foundation.Canvas(modifier = Modifier.size(18.dp)) {
        val w = size.width
        val h = size.height
        // G shape rendered as four arcs via drawArc with clip paths — simplified to just colored rects
        // We draw the 4-color Google G icon using drawPath approximations
        drawArc(color = Color(0xFF4285F4), startAngle = -90f, sweepAngle = 180f, useCenter = false,
            topLeft = androidx.compose.ui.geometry.Offset(0f, 0f), size = size)
        drawArc(color = Color(0xFF34A853), startAngle = 90f, sweepAngle = 90f, useCenter = false,
            topLeft = androidx.compose.ui.geometry.Offset(0f, 0f), size = size)
        drawArc(color = Color(0xFFFBBC05), startAngle = 180f, sweepAngle = 90f, useCenter = false,
            topLeft = androidx.compose.ui.geometry.Offset(0f, 0f), size = size)
        drawArc(color = Color(0xFFEA4335), startAngle = 270f, sweepAngle = 90f, useCenter = false,
            topLeft = androidx.compose.ui.geometry.Offset(0f, 0f), size = size)
        drawCircle(color = Color.White, radius = w * 0.35f,
            center = androidx.compose.ui.geometry.Offset(w / 2f, h / 2f))
        drawRect(color = Color(0xFF4285F4),
            topLeft = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.38f),
            size = androidx.compose.ui.geometry.Size(w * 0.5f, h * 0.24f))
    }
}

@Composable
fun OtpScreen(
    country: CountryOption,
    phone: String,
    otp: String,
    resendCooldownSeconds: Int,
    isLoading: Boolean,
    errorMessage: String?,
    infoMessage: String?,
    sheetMode: Boolean = false,
    onOtpChanged: (String) -> Unit,
    onVerify: () -> Unit,
    onResend: () -> Unit,
    onChangeNumber: () -> Unit
) {
    val scrollState = rememberScrollState()
    val fontScale = LocalDensity.current.fontScale

    AuthContainer(sheetMode = sheetMode) {
        Column(
            modifier = (if (sheetMode) Modifier.fillMaxWidth() else Modifier.fillMaxSize())
                .then(if (sheetMode) Modifier else Modifier.statusBarsPadding().navigationBarsPadding())
                .imePadding()
                .verticalScroll(scrollState)
                .padding(horizontal = 22.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            SectionHeader(
                eyebrow = "Verify OTP",
                title = "+${country.dialCode} $phone"
            )

            Card(
                shape = RoundedCornerShape(30.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    Text(
                        text = "Enter the 4-digit code we sent to your number.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextSecondary
                    )
                    OtpField(
                        value = otp,
                        onValueChange = onOtpChanged,
                        enabled = !isLoading
                    )
                    if (!errorMessage.isNullOrBlank()) {
                        Text(
                            text = errorMessage,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    } else if (!infoMessage.isNullOrBlank()) {
                        Text(
                            text = infoMessage,
                            color = Lavender,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                    Button(
                        onClick = onVerify,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isLoading && otp.length == Constants.Auth.OTP_MAX_LENGTH,
                        shape = RoundedCornerShape(20.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Lavender,
                            contentColor = Color(0xFF481865)
                        )
                    ) {
                        Text(
                            "Verify and continue"
                        )
                    }
                    BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                        val stackActions = maxWidth < 320.dp || fontScale > 1.1f

                        if (stackActions) {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                TextButton(onClick = onChangeNumber, enabled = !isLoading) {
                                    Text("Change number", color = TextPrimary)
                                }
                                TextButton(
                                    onClick = onResend,
                                    enabled = !isLoading && resendCooldownSeconds == 0
                                ) {
                                    Text(
                                        text = if (resendCooldownSeconds > 0) {
                                            "Resend in ${resendCooldownSeconds}s"
                                        } else {
                                            "Resend OTP"
                                        },
                                        color = if (resendCooldownSeconds > 0) TextSecondary.copy(alpha = 0.45f) else Lavender,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextButton(onClick = onChangeNumber, enabled = !isLoading) {
                                    Text("Change number", color = TextPrimary)
                                }
                                TextButton(
                                    onClick = onResend,
                                    enabled = !isLoading && resendCooldownSeconds == 0
                                ) {
                                    Text(
                                        text = if (resendCooldownSeconds > 0) {
                                            "Resend in ${resendCooldownSeconds}s"
                                        } else {
                                            "Resend OTP"
                                        },
                                        color = if (resendCooldownSeconds > 0) TextSecondary.copy(alpha = 0.45f) else Lavender
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Text(
                text = "Wait for the timer before requesting another OTP.",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun LoginErrorScreen(
    title: String,
    message: String,
    actionLabel: String,
    onAction: () -> Unit
) {
    AuthSurface {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                modifier = Modifier.size(74.dp),
                shape = CircleShape,
                color = SoftRose
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.SignalWifiOff,
                        contentDescription = null,
                        tint = Rose
                    )
                }
            }
            Spacer(modifier = Modifier.height(18.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = onAction,
                shape = RoundedCornerShape(20.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Lavender,
                    contentColor = Color(0xFF481865)
                )
            ) {
                Text(actionLabel)
            }
        }
    }
}

@Composable
private fun AuthSurface(content: @Composable BoxScope.() -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "auth-surface")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(5000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ShellBackground)
    ) {
        AnimatedBackdrop(progress = pulse)
        content()
    }
}

@Composable
private fun AuthContainer(
    sheetMode: Boolean,
    content: @Composable BoxScope.() -> Unit
) {
    if (sheetMode) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Transparent)
        ) {
            content()
        }
    } else {
        AuthSurface(content = content)
    }
}

@Composable
private fun AnimatedBackdrop(progress: Float) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(ShellBackground, Color(0xFFF7ECFB), Color(0xFFFFFCFF))
            )
        )
        drawCircle(
            color = Lavender.copy(alpha = 0.24f),
            radius = size.minDimension * (0.34f + progress * 0.04f),
            center = Offset(size.width * (0.84f - progress * 0.06f), size.height * 0.16f)
        )
        drawCircle(
            color = Gold.copy(alpha = 0.14f),
            radius = size.minDimension * (0.28f + progress * 0.03f),
            center = Offset(size.width * 0.18f, size.height * (0.23f + progress * 0.08f))
        )
        drawCircle(
            color = Rose.copy(alpha = 0.12f),
            radius = size.minDimension * 0.42f,
            center = Offset(size.width * (0.12f + progress * 0.05f), size.height * 0.9f)
        )
    }
}

@Composable
private fun LandingTopBar(onLoginClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            painter = painterResource(id = R.drawable.amgel_logo),
            contentDescription = stringResource(id = R.string.app_name),
            modifier = Modifier.size(42.dp)
        )

        Surface(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .clickable(onClick = onLoginClick),
            shape = RoundedCornerShape(20.dp),
            color = Color.White.copy(alpha = 0.92f),
            border = BorderStroke(1.dp, OutlineSoft)
        ) {
            Text(
                text = "Log In",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 11.dp)
            )
        }
    }
}

@Composable
private fun HeroCard(
    onPrimaryAction: () -> Unit,
    progress: Float
) {
    Card(
        shape = RoundedCornerShape(34.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        border = BorderStroke(1.dp, OutlineSoft.copy(alpha = 0.18f))
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(0.75f)
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(Color(0xFFFFFCFF), Color(0xFFF9EEFF), Color(0xFFFFF0F7))
                    )
                )
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                drawCircle(
                    color = Gold.copy(alpha = 0.14f),
                    radius = size.minDimension * (0.28f + progress * 0.04f),
                    center = Offset(size.width * 0.9f, size.height * 0.14f)
                )
                drawCircle(
                    color = Lavender.copy(alpha = 0.24f),
                    radius = size.minDimension * (0.38f + progress * 0.03f),
                    center = Offset(size.width * 0.08f, size.height * 0.86f)
                )
            }

            Image(
                painter = painterResource(id = R.drawable.hero_landing_art),
                contentDescription = "Amgel Jodi hero artwork",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
                    .fillMaxHeight(0.88f)
                    .clip(RoundedCornerShape(34.dp))
                    .alpha(0.98f)
            )

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.14f),
                                Color.Transparent,
                                Color.White.copy(alpha = 0.18f)
                            ),
                        )
                    )
            )

            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 22.dp)
            ) {
                Button(
                    onClick = onPrimaryAction,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(22.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Lavender,
                        contentColor = Color(0xFF481865)
                    )
                ) {
                    Text("Get Started")
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(
    eyebrow: String,
    title: String
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            text = eyebrow.uppercase(),
            style = MaterialTheme.typography.labelMedium,
            letterSpacing = 1.sp,
            color = Gold,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )
    }
}


@Composable
private fun TrustSection() {
    Card(
        shape = RoundedCornerShape(34.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        border = BorderStroke(1.dp, OutlineSoft.copy(alpha = 0.18f))
    ) {
        Image(
            painter = painterResource(id = R.drawable.feature_trust_art),
            contentDescription = "Amgel Jodi trust features artwork",
            contentScale = ContentScale.FillWidth,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(34.dp))
        )
    }
}

@Composable
private fun StatusPill(text: String) {
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = SurfaceRaised
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.AutoAwesome,
                contentDescription = null,
                tint = Lavender,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = text,
                style = MaterialTheme.typography.bodyMedium,
                color = TextPrimary
            )
        }
    }
}

@Composable
private fun OtpField(
    value: String,
    onValueChange: (String) -> Unit,
    enabled: Boolean
) {
    val focusRequester = remember { FocusRequester() }
    val keyboardController = LocalSoftwareKeyboardController.current
    val interactionSource = remember { MutableInteractionSource() }
    val fontScale = LocalDensity.current.fontScale

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
        keyboardController?.show()
    }

    BasicTextField(
        value = value,
        onValueChange = { next ->
            onValueChange(next.filter(Char::isDigit).take(Constants.Auth.OTP_MAX_LENGTH))
        },
        enabled = enabled,
        singleLine = true,
        modifier = Modifier
            .fillMaxWidth()
            .focusRequester(focusRequester),
        textStyle = MaterialTheme.typography.bodySmall.copy(color = Color.Transparent),
        cursorBrush = SolidColor(Color.Transparent),
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.NumberPassword,
            imeAction = ImeAction.Done
        ),
        keyboardActions = KeyboardActions(onDone = { keyboardController?.hide() }),
        decorationBox = { innerTextField ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .clickable(
                        enabled = enabled,
                        interactionSource = interactionSource,
                        indication = null
                    ) {
                        focusRequester.requestFocus()
                        keyboardController?.show()
                    }
            ) {
                BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                    val compact = maxWidth < 320.dp || fontScale > 1.1f
                    val spacing = if (compact) 8.dp else 12.dp
                    val boxWidth = ((maxWidth - (spacing * 3)) / Constants.Auth.OTP_MAX_LENGTH).coerceIn(48.dp, 58.dp)
                    val boxHeight = if (compact) 58.dp else 64.dp

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(spacing, Alignment.CenterHorizontally)
                    ) {
                        repeat(Constants.Auth.OTP_MAX_LENGTH) { index ->
                            val char = value.getOrNull(index)?.toString().orEmpty()
                            val isFilled = index < value.length
                            val isActive = index == value.length.coerceAtMost(Constants.Auth.OTP_MAX_LENGTH - 1)
                            Surface(
                                modifier = Modifier.size(width = boxWidth, height = boxHeight),
                                shape = RoundedCornerShape(20.dp),
                                color = if (isFilled) SoftLilac else SurfaceRaised,
                                border = BorderStroke(
                                    width = if (isActive) 2.dp else 1.dp,
                                    color = when {
                                        isActive -> Lavender
                                        isFilled -> Color.Transparent
                                        else -> OutlineSoft
                                    }
                                )
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    if (char.isNotEmpty()) {
                                        Text(
                                            text = char,
                                            style = MaterialTheme.typography.headlineSmall,
                                            fontWeight = FontWeight.SemiBold,
                                            color = TextPrimary
                                        )
                                    } else if (isActive) {
                                        OtpCaret()
                                    }
                                }
                            }
                        }
                    }
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .alpha(0.01f)
                ) {
                    innerTextField()
                }
            }
        }
    )
}

@Composable
private fun OtpCaret() {
    val infiniteTransition = rememberInfiniteTransition(label = "otp-caret")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(700),
            repeatMode = RepeatMode.Reverse
        ),
        label = "caret-alpha"
    )

    Box(
        modifier = Modifier
            .width(2.dp)
            .height(26.dp)
            .background(Lavender.copy(alpha = alpha), RoundedCornerShape(999.dp))
    )
}

@Composable
private fun QuickLinksSection(onLinkClick: (String) -> Unit) {
    val items = listOf(
        QuickLinkItem("About Us", "about", Icons.Default.Info, Color(0xFF9B6CF4), Color(0xFFF0E7FF)),
        QuickLinkItem("Contact Us", "contact", Icons.Default.MailOutline, Color(0xFFFF6F91), Color(0xFFFFE7EE)),
        QuickLinkItem("Privacy Policy", "privacy", Icons.Default.Lock, Color(0xFFB18AF7), Color(0xFFF1EBFF)),
        QuickLinkItem("Child Safety", "child-safety", Icons.Outlined.VerifiedUser, Color(0xFFC6BFD6), Color(0xFFF4F1F8))
    )

    Card(
        shape = RoundedCornerShape(34.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        border = BorderStroke(1.dp, OutlineSoft.copy(alpha = 0.18f))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Quick Links",
                style = MaterialTheme.typography.titleMedium.copy(fontSize = 16.sp),
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            )

            items.forEach { item ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .clickable { onLinkClick(item.key) },
                    shape = RoundedCornerShape(24.dp),
                    color = Color.White.copy(alpha = 0.7f),
                    border = BorderStroke(1.dp, OutlineSoft.copy(alpha = 0.16f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            modifier = Modifier.size(34.dp),
                            shape = CircleShape,
                            color = item.iconBg
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = null,
                                    tint = item.iconTint,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                        Text(
                            text = item.label,
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                            fontWeight = FontWeight.Medium,
                            color = TextPrimary,
                            modifier = Modifier.weight(1f)
                        )
                        Icon(
                            imageVector = Icons.Default.KeyboardArrowRight,
                            contentDescription = null,
                            tint = Color(0xFFC9C1D5),
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }
        }
    }
}

private data class QuickLinkItem(
    val label: String,
    val key: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val iconTint: Color,
    val iconBg: Color
)

@Composable
private fun LandingFooterArt() {
    Image(
        painter = painterResource(id = R.drawable.landing_footer_flush),
        contentDescription = "Amgel Jodi closing artwork",
        contentScale = ContentScale.FillWidth,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp)
    )
}
