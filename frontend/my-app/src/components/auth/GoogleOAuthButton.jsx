import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getCurrentOrigin, getGoogleAuthConfig, getGoogleAuthStatusMessage } from '../../utils/googleAuth';

const GoogleOAuthButton = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const googleAuth = getGoogleAuthConfig();

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
    const origin = getCurrentOrigin();
    toast.error(
      origin
        ? `Google sign-in failed. Make sure ${origin} is added to Google OAuth authorized JavaScript origins.`
        : 'Google authentication failed'
    );
  };

  if (!googleAuth.enabled) {
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
        containerProps={{ style: { width: '100%' } }}
      />
    </div>
  );
};

export default GoogleOAuthButton;
