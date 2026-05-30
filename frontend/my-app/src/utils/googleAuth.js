const getEnvValue = (value) => (typeof value === 'string' ? value.trim() : '');

export const getGoogleClientId = () => getEnvValue(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export const getGoogleAuthConfig = () => {
  const clientId = getGoogleClientId();
  const envToggle = getEnvValue(import.meta.env.VITE_ENABLE_GOOGLE_AUTH);

  if (!clientId) {
    return {
      enabled: false,
      clientId: '',
      reason: 'missing-client-id',
      message: 'Google sign-in is unavailable because VITE_GOOGLE_CLIENT_ID is not configured for this build.',
    };
  }

  if (envToggle === 'false') {
    return {
      enabled: false,
      clientId,
      reason: 'disabled-by-env',
      message: 'Google sign-in is disabled for this build because VITE_ENABLE_GOOGLE_AUTH is set to false.',
    };
  }

  return {
    enabled: true,
    clientId,
    reason: 'enabled',
    message: '',
  };
};

export const isGoogleAuthEnabled = () => getGoogleAuthConfig().enabled;

export const getGoogleAuthStatusMessage = () => getGoogleAuthConfig().message;

export const getCurrentOrigin = () =>
  typeof window === 'undefined' ? '' : window.location.origin;
