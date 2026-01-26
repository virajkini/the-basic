/**
 * MSG91 OTP Service
 * Server-side implementation for secure OTP management
 *
 * This service is designed to be easily replaceable with other providers.
 * To switch providers:
 * 1. Create a new service file (e.g., twilioService.ts)
 * 2. Implement the same interface (sendOtp, verifyOtp)
 * 3. Update the import in routes/otp.ts
 */

import https from 'https';

// MSG91 Configuration from environment variables
const MSG91_AUTH_KEY = process.env.MSG_TOKEN || '';
const MSG91_WIDGET_ID = process.env.MSG91_WIDGET_ID || '3661726c7465313237383732';
const MSG91_API_BASE = 'api.msg91.com';

// API endpoints
const SEND_OTP_PATH = '/api/v5/widget/sendOtp';
const VERIFY_OTP_PATH = '/api/v5/widget/verifyOtp';

interface SendOtpResponse {
  type: 'success' | 'error';
  message: string;
  requestId?: string;
}

interface VerifyOtpResponse {
  type: 'success' | 'error';
  message: string;
}

/**
 * Send OTP to a phone number
 * @param phone - Phone number with country code (e.g., "919876543210")
 * @returns Promise with request ID for verification
 */
export const sendOtp = async (phone: string): Promise<string> => {
  if (!MSG91_AUTH_KEY) {
    throw new Error('MSG91 auth key is not configured');
  }

  const payload = JSON.stringify({
    widgetId: MSG91_WIDGET_ID,
    identifier: phone,
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: MSG91_API_BASE,
      port: null,
      path: SEND_OTP_PATH,
      headers: {
        authkey: MSG91_AUTH_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      console.log('[MSG91] Send OTP HTTP status:', res.statusCode);
      console.log('[MSG91] Send OTP headers:', res.headers);

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString();
          console.log('[MSG91] Send OTP raw response:', body);

          const data = JSON.parse(body) as SendOtpResponse;
          console.log('[MSG91] Send OTP parsed response:', data);

          if (data.type === 'error') {
            reject(new Error(data.message || 'Failed to send OTP'));
            return;
          }

          // MSG91 returns the request ID in the 'message' field when successful
          // Try multiple possible field names for compatibility
          const requestId = data.message || (data as any).requestId || (data as any).request_id || (data as any).reqId;

          if (!requestId) {
            console.error('[MSG91] No request ID in response. Full response:', data);
            reject(new Error('No request ID received from MSG91'));
            return;
          }

          console.log('[MSG91] Request ID extracted:', requestId);
          resolve(requestId);
        } catch (error) {
          console.error('[MSG91] Parse error:', error);
          reject(new Error('Failed to parse MSG91 response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[MSG91] Send OTP error:', error);
      reject(new Error('Network error while sending OTP'));
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Verify OTP
 * @param requestId - Request ID from sendOtp response
 * @param otp - OTP code entered by user
 * @returns Promise<boolean> - true if OTP is valid
 */
export const verifyOtp = async (requestId: string, otp: string): Promise<boolean> => {
  if (!MSG91_AUTH_KEY) {
    throw new Error('MSG91 auth key is not configured');
  }

  const payload = JSON.stringify({
    widgetId: MSG91_WIDGET_ID,
    reqId: requestId,
    otp: otp,
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: MSG91_API_BASE,
      port: null,
      path: VERIFY_OTP_PATH,
      headers: {
        authkey: MSG91_AUTH_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString();
          const data = JSON.parse(body) as VerifyOtpResponse;

          console.log('[MSG91] Verify OTP response:', data);

          if (data.type === 'error') {
            reject(new Error(data.message || 'OTP verification failed'));
            return;
          }

          resolve(data.type === 'success');
        } catch (error) {
          reject(new Error('Failed to parse MSG91 response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[MSG91] Verify OTP error:', error);
      reject(new Error('Network error while verifying OTP'));
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Resend OTP (uses the same sendOtp function)
 * @param phone - Phone number with country code
 * @returns Promise with new request ID
 */
export const resendOtp = async (phone: string): Promise<string> => {
  return sendOtp(phone);
};
