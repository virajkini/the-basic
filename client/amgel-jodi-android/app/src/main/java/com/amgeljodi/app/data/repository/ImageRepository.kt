package com.amgeljodi.app.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.os.Environment
import android.util.Base64
import androidx.core.content.FileProvider
import androidx.exifinterface.media.ExifInterface
import com.amgeljodi.app.util.Constants
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for handling image operations:
 * - Creating temp files for camera capture
 * - Processing and compressing images
 * - Converting to base64 for web
 */
@Singleton
class ImageRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val maxImageSizeBytes = Constants.FilePicker.MAX_IMAGE_SIZE_MB * 1024 * 1024
    private val imageQuality = Constants.FilePicker.IMAGE_QUALITY

    /**
     * Creates a temporary file for camera capture
     * @return Pair of File and its content URI for sharing
     */
    fun createImageFile(): Pair<File, Uri> {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "${Constants.FilePicker.CAPTURED_IMAGE_PREFIX}${timeStamp}"
        val storageDir = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)

        val imageFile = File.createTempFile(imageFileName, ".jpg", storageDir)

        val imageUri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            imageFile
        )

        return Pair(imageFile, imageUri)
    }

    /**
     * Processes an image URI and returns base64 encoded string
     * Handles rotation, compression, and size limits
     */
    suspend fun processImage(uri: Uri): Result<ImageData> = withContext(Dispatchers.IO) {
        try {
            val inputStream = context.contentResolver.openInputStream(uri)
                ?: return@withContext Result.failure(Exception("Cannot open image"))

            // Read bitmap
            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            if (originalBitmap == null) {
                return@withContext Result.failure(Exception("Cannot decode image"))
            }

            // Get EXIF rotation
            val rotation = getExifRotation(uri)

            // Rotate if needed
            val rotatedBitmap = if (rotation != 0) {
                rotateBitmap(originalBitmap, rotation)
            } else {
                originalBitmap
            }

            // Compress and resize if needed
            val processedBitmap = resizeIfNeeded(rotatedBitmap)

            // Convert to base64
            val base64 = bitmapToBase64(processedBitmap)

            // Get dimensions
            val width = processedBitmap.width
            val height = processedBitmap.height

            // Clean up
            if (rotatedBitmap != originalBitmap) {
                originalBitmap.recycle()
            }
            if (processedBitmap != rotatedBitmap) {
                rotatedBitmap.recycle()
            }

            Result.success(ImageData(
                base64 = base64,
                mimeType = "image/jpeg",
                width = width,
                height = height
            ))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Process multiple images (respecting max limit)
     */
    suspend fun processImages(uris: List<Uri>): List<Result<ImageData>> {
        val limitedUris = uris.take(Constants.FilePicker.MAX_IMAGES)
        return limitedUris.map { uri -> processImage(uri) }
    }

    private fun getExifRotation(uri: Uri): Int {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return 0
            val exif = ExifInterface(inputStream)
            inputStream.close()

            when (exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90
                ExifInterface.ORIENTATION_ROTATE_180 -> 180
                ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }
        } catch (e: Exception) {
            0
        }
    }

    private fun rotateBitmap(bitmap: Bitmap, degrees: Int): Bitmap {
        val matrix = Matrix().apply { postRotate(degrees.toFloat()) }
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }

    private fun resizeIfNeeded(bitmap: Bitmap): Bitmap {
        // Target max dimension
        val maxDimension = 2048

        if (bitmap.width <= maxDimension && bitmap.height <= maxDimension) {
            return bitmap
        }

        val ratio = minOf(
            maxDimension.toFloat() / bitmap.width,
            maxDimension.toFloat() / bitmap.height
        )

        val newWidth = (bitmap.width * ratio).toInt()
        val newHeight = (bitmap.height * ratio).toInt()

        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()

        // Start with configured quality
        var quality = imageQuality
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)

        // Reduce quality if too large
        while (outputStream.size() > maxImageSizeBytes && quality > 10) {
            outputStream.reset()
            quality -= 10
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
        }

        val byteArray = outputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }

    /**
     * Clean up temporary files
     */
    fun cleanupTempFiles() {
        val storageDir = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        storageDir?.listFiles()?.forEach { file ->
            if (file.name.startsWith(Constants.FilePicker.CAPTURED_IMAGE_PREFIX)) {
                file.delete()
            }
        }
    }
}

/**
 * Data class representing a processed image
 */
data class ImageData(
    val base64: String,
    val mimeType: String,
    val width: Int,
    val height: Int
)
