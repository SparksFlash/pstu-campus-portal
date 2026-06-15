import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Please enter your email address.');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setInfo(res.message || 'OTP sent to your email. It expires in 10 minutes.');
      setStep(2);
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) return setError('Please enter the 6-digit OTP.');
    if (!password || password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await authService.resetPassword(email, otp, password);
      navigate('/login', { state: { info: res.message || 'Password reset successful. You can now log in.' } });
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="bg-white p-8 rounded-lg shadow-premium w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-600">PSTU</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {step === 1 ? 'Reset your password' : 'Enter OTP & new password'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        {info && step === 2 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {info}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="your@email.com"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-digit OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none tracking-widest text-center text-xl font-bold"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Repeat password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setOtp(''); setPassword(''); setConfirmPassword(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Didn't receive the OTP? Go back
            </button>
          </form>
        )}

        <div className="mt-5 text-center">
          <a href="/login" className="text-sm text-primary-600 hover:underline">Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
