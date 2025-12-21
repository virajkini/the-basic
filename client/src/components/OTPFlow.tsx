import { useState } from 'react';
import { api } from '../utils/apiClient';

function OTPFlow() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Normalize phone number - add +91 if not present
      let normalizedPhone = phone.trim();
      if (!normalizedPhone.startsWith('+')) {
        if (normalizedPhone.startsWith('91')) {
          normalizedPhone = '+' + normalizedPhone;
        } else {
          normalizedPhone = '+91' + normalizedPhone;
        }
      }

      const response = await api.post('/auth/otp/send', { phone: normalizedPhone });

      if (response.ok) {
        setStep('otp');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error sending OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Normalize phone number
      let normalizedPhone = phone.trim();
      if (!normalizedPhone.startsWith('+')) {
        if (normalizedPhone.startsWith('91')) {
          normalizedPhone = '+' + normalizedPhone;
        } else {
          normalizedPhone = '+91' + normalizedPhone;
        }
      }

      const response = await api.post('/auth/otp/verify', {
        phone: normalizedPhone,
        otp: otp.trim(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setAuthenticated(true);
          setSuccess(true);
          // Reset form after successful login
          setTimeout(() => {
            setStep('phone');
            setPhone('');
            setOtp('');
            setSuccess(false);
          }, 2000);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error verifying OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
      setAuthenticated(false);
      setStep('phone');
      setPhone('');
      setOtp('');
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authenticated) {
    return (
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-800 font-medium">✓ Authenticated</p>
            <p className="text-sm text-green-600 mt-1">Logged in as {phone}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Login with OTP</h2>

      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="8892043505"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Test: 8892043505, OTP: 1111
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">OTP sent successfully!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              OTP sent to {phone}
            </p>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="1111"
              required
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">Login successful!</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Change Phone
            </button>
            <button
              type="submit"
              disabled={loading || !otp.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default OTPFlow;
