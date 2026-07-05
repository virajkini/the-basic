import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging, Message, MulticastMessage } from 'firebase-admin/messaging';

export function initializeFCM(): void {
  if (getApps().length > 0) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled');
    return;
  }

  try {
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
    console.log('[FCM] Firebase Admin SDK initialized');
  } catch (error) {
    console.error('[FCM] Failed to initialize Firebase Admin SDK:', error);
  }
}

function isReady(): boolean {
  return getApps().length > 0;
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string
): Promise<boolean> {
  if (!isReady()) return false;

  try {
    const message: Message = {
      token,
      notification: { title, body, ...(imageUrl && { imageUrl }) },
      ...(data && { data: imageUrl ? { ...data, imageUrl } : data }),
      android: {
        priority: 'high',
        notification: {
          channelId: data?.channelId ?? 'connections',
          sound: 'default',
          ...(imageUrl && { imageUrl }),
        },
      },
    };

    await getMessaging().send(message);
    return true;
  } catch (error: any) {
    const code = error?.errorInfo?.code ?? error?.code ?? '';
    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
      return false;
    }
    console.error('[FCM] sendPushNotification error:', error?.message ?? error);
    return false;
  }
}

export async function sendMulticastNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string
): Promise<number> {
  if (!isReady() || tokens.length === 0) return 0;

  const BATCH_SIZE = 500;
  let successCount = 0;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    try {
      const message: MulticastMessage = {
        tokens: batch,
        notification: { title, body, ...(imageUrl && { imageUrl }) },
        ...(data && { data: imageUrl ? { ...data, imageUrl } : data }),
        android: {
          priority: 'high',
          notification: {
            channelId: data?.channelId ?? 'custom',
            sound: 'default',
            ...(imageUrl && { imageUrl }),
          },
        },
      };

      const response = await getMessaging().sendEachForMulticast(message);
      successCount += response.successCount;
    } catch (error) {
      console.error('[FCM] sendMulticastNotification batch error:', error);
    }
  }

  return successCount;
}
