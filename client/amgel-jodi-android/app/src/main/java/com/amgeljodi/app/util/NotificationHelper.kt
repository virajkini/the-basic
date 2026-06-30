package com.amgeljodi.app.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.amgeljodi.app.MainActivity
import com.amgeljodi.app.R

object NotificationHelper {

    const val CHANNEL_CONNECTIONS = "connections"
    const val CHANNEL_CUSTOM = "custom"

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val connectionsChannel = NotificationChannel(
            CHANNEL_CONNECTIONS,
            "Connection Requests",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Notifications for new connection requests and acceptances"
            enableVibration(true)
        }

        val customChannel = NotificationChannel(
            CHANNEL_CUSTOM,
            "Announcements",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "General announcements from Amgel Jodi"
        }

        manager.createNotificationChannel(connectionsChannel)
        manager.createNotificationChannel(customChannel)
    }

    fun showNotification(
        context: Context,
        title: String,
        body: String,
        deepLink: String? = null,
        channelId: String = CHANNEL_CONNECTIONS,
        notificationId: Int = System.currentTimeMillis().toInt(),
        imageBitmap: Bitmap? = null
    ) {
        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            deepLink?.let { putExtra("deepLink", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val largeIcon = BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher_round)

        val style = if (imageBitmap != null) {
            NotificationCompat.BigPictureStyle()
                .bigPicture(imageBitmap)
                .bigLargeIcon(null as Bitmap?)
                .setSummaryText(body)
        } else {
            NotificationCompat.BigTextStyle().bigText(body)
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setLargeIcon(largeIcon)
            .setColor(ContextCompat.getColor(context, R.color.notification_color))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(style)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(
                if (channelId == CHANNEL_CONNECTIONS) NotificationCompat.PRIORITY_HIGH
                else NotificationCompat.PRIORITY_DEFAULT
            )
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(notificationId, notification)
    }
}
