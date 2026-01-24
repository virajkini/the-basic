plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.amgeljodi.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.amgeljodi.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            isDebuggable = true
            buildConfigField("String", "BASE_URL", "\"https://app.amgeljodi.com/dashboard\"")
            buildConfigField("String", "DEBUG_URL", "\"http://localhost:3002/dashboard\"")
            buildConfigField("Boolean", "ALLOW_URL_TOGGLE", "true")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("String", "BASE_URL", "\"https://app.amgeljodi.com/dashboard\"")
            buildConfigField("String", "DEBUG_URL", "\"https://app.amgeljodi.com/dashboard\"")
            buildConfigField("Boolean", "ALLOW_URL_TOGGLE", "false")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Core Android
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    debugImplementation(libs.androidx.ui.tooling)

    // Navigation
    implementation(libs.androidx.navigation.compose)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    // DataStore
    implementation(libs.androidx.datastore.preferences)

    // Splash Screen
    implementation(libs.androidx.splashscreen)

    // Biometric
    implementation(libs.androidx.biometric)

    // WebView
    implementation(libs.androidx.webkit)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Image Loading
    implementation(libs.coil.compose)

    // JSON
    implementation(libs.gson)

    // Lottie
    implementation(libs.lottie.compose)

    // Accompanist
    implementation(libs.accompanist.permissions)
    implementation(libs.accompanist.systemuicontroller)

    // ExifInterface for image rotation handling
    implementation(libs.androidx.exifinterface)
}
