import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getGoogleAuthStatusMessage, isGoogleAuthEnabled } from '../../utils/googleAuth';

const GoogleOAuthButton = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const googleAuthEnabled = isGoogleAuthEnabled();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await authAPI.googleAuth(credentialResponse.credential);
      onSuccess(response.data.user, response.data.accessToken);
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast.error('Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google authentication failed');
  };

  if (!googleAuthEnabled) {
    return (
      <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left">
        <p className="text-sm font-medium text-amber-300">Google sign-in unavailable</p>
        <p className="mt-1 text-xs text-amber-200/90">
          {getGoogleAuthStatusMessage()}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        theme="filled_black"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="100%"
      />
    </div>
  );
};

export default GoogleOAuthButton;
