package com.amgeljodi.app.ui.splash

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.amgeljodi.app.R
import com.amgeljodi.app.ui.theme.GradientEnd
import com.amgeljodi.app.ui.theme.GradientStart
import kotlinx.coroutines.delay

/**
 * Animated splash screen with logo and tagline
 * Shows a heart icon with scale and fade animations
 */
@Composable
fun SplashScreen(
    onSplashComplete: () -> Unit
) {
    // Animation states
    val logoScale = remember { Animatable(0f) }
    val logoAlpha = remember { Animatable(0f) }
    val textAlpha = remember { Animatable(0f) }
    val pulseScale = remember { Animatable(1f) }

    // Run animations
    LaunchedEffect(key1 = true) {
        // Logo appears with bounce
        logoAlpha.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 400)
        )

        logoScale.animateTo(
            targetValue = 1f,
            animationSpec = tween(
                durationMillis = 600,
                easing = FastOutSlowInEasing
            )
        )

        // Small delay before text
        delay(200)

        // Text fades in
        textAlpha.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 400)
        )

        // Gentle pulse animation
        repeat(2) {
            pulseScale.animateTo(
                targetValue = 1.1f,
                animationSpec = tween(durationMillis = 300)
            )
            pulseScale.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 300)
            )
        }

        // Small delay then proceed
        delay(300)
        onSplashComplete()
    }

    // UI
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(GradientStart, GradientEnd)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo with white circle background
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .scale(logoScale.value * pulseScale.value)
                    .alpha(logoAlpha.value)
                    .background(Color.White, shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_notification),
                    contentDescription = "Amgel Jodi Logo",
                    modifier = Modifier.size(60.dp),
                    tint = GradientStart
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // App name
            Text(
                text = stringResource(R.string.app_name),
                color = Color.White,
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.alpha(textAlpha.value)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Tagline
            Text(
                text = stringResource(R.string.app_tagline),
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.alpha(textAlpha.value)
            )
        }

        // Loading indicator at bottom
        Box(
            modifier = Modifier
                .fillMaxSize()
                .alpha(textAlpha.value),
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.align(Alignment.BottomCenter)
            ) {
                LoadingDots()
                Spacer(modifier = Modifier.height(48.dp))
            }
        }
    }
}

/**
 * Animated loading dots
 */
@Composable
private fun LoadingDots() {
    val dot1Alpha = remember { Animatable(0.3f) }
    val dot2Alpha = remember { Animatable(0.3f) }
    val dot3Alpha = remember { Animatable(0.3f) }

    LaunchedEffect(key1 = true) {
        while (true) {
            // Dot 1
            dot1Alpha.animateTo(1f, animationSpec = tween(200))
            dot1Alpha.animateTo(0.3f, animationSpec = tween(200))

            // Dot 2
            dot2Alpha.animateTo(1f, animationSpec = tween(200))
            dot2Alpha.animateTo(0.3f, animationSpec = tween(200))

            // Dot 3
            dot3Alpha.animateTo(1f, animationSpec = tween(200))
            dot3Alpha.animateTo(0.3f, animationSpec = tween(200))
        }
    }

    androidx.compose.foundation.layout.Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .alpha(dot1Alpha.value)
                .background(Color.White, CircleShape)
        )
        Box(
            modifier = Modifier
                .size(8.dp)
                .alpha(dot2Alpha.value)
                .background(Color.White, CircleShape)
        )
        Box(
            modifier = Modifier
                .size(8.dp)
                .alpha(dot3Alpha.value)
                .background(Color.White, CircleShape)
        )
    }
}
