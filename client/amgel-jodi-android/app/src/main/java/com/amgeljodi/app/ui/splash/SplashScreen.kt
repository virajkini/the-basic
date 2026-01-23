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
 * Quick splash screen with logo and tagline
 * Shows branding briefly then transitions to content fast
 */
@Composable
fun SplashScreen(
    onSplashComplete: () -> Unit
) {
    // Animation states - start visible for faster display
    val logoScale = remember { Animatable(0.8f) }
    val contentAlpha = remember { Animatable(0f) }

    // Run quick animations - no blocking delays
    LaunchedEffect(key1 = true) {
        // Quick fade in
        contentAlpha.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 200)
        )

        // Quick scale
        logoScale.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing)
        )

        // Brief display then proceed - fast transition to content
        delay(400)
        onSplashComplete()
    }

    // UI - Soft purple gradient background
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color(0xFF8b5cf6),  // Soft violet
                        Color(0xFF7c3aed)   // Purple
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.alpha(contentAlpha.value)
        ) {
            // Logo with white circle background
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .scale(logoScale.value)
                    .background(Color.White, shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_notification),
                    contentDescription = "Amgel Jodi Logo",
                    modifier = Modifier.size(50.dp),
                    tint = Color(0xFF7c3aed)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // App name
            Text(
                text = stringResource(R.string.app_name),
                color = Color.White,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Tagline
            Text(
                text = stringResource(R.string.app_tagline),
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Community text
            Text(
                text = stringResource(R.string.app_community),
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 12.sp,
                fontWeight = FontWeight.Normal
            )
        }
    }
}

