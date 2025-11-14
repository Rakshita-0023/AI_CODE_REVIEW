import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('select'); // select, input, otp, reset
  const [resetType, setResetType] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [devOTP, setDevOTP] = useState('');

  const handleTypeSelect = (type) => {
    setResetType(type);
    setStep('input');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ identifier, type: resetType });
      toast.success(response.data.message);
      

      
      setStep('otp');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.verifyOTP({ identifier, type: resetType, otp });
      setResetToken(response.data.resetToken);
      toast.success(response.data.message);
      setStep('reset');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.resetPassword({
        resetToken,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword
      });
      toast.success(response.data.message);
      navigate('/signin');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/20">
        
        {step === 'select' && (
          <>
            <h2 className="text-3xl font-bold text-white text-center mb-8">Reset Password</h2>
            <div className="space-y-4">
              <button
                onClick={() => handleTypeSelect('email')}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 text-white transition-all"
              >
                 Reset using Email
              </button>
              <button
                onClick={() => handleTypeSelect('phone')}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 text-white transition-all"
              >
                📱 Reset using Phone Number
              </button>
            </div>
          </>
        )}

        {step === 'input' && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Enter your {resetType === 'email' ? 'Email' : 'Phone Number'}
            </h2>
            <form onSubmit={handleSendOTP} className="space-y-6">
              <input
                type={resetType === 'email' ? 'email' : 'tel'}
                placeholder={resetType === 'email' ? 'Enter your email' : 'Enter your phone (+91XXXXXXXXXX)'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-400"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-8">Enter OTP</h2>
            

            
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-400 text-center text-2xl tracking-widest"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-8">Set New Password</h2>
            <form onSubmit={handleResetPassword} className="space-y-6">
              <input
                type="password"
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-400"
                required
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-400"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-white/70 mt-6">
          <Link to="/signin" className="text-purple-400 hover:text-purple-300 font-semibold">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;