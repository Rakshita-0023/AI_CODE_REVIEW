import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const GoogleOAuthButton = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);

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