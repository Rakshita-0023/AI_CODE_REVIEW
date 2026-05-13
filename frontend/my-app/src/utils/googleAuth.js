const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export const isGoogleAuthEnabled = () => {
  const envToggle = import.meta.env.VITE_ENABLE_GOOGLE_AUTH;

  if (envToggle === 'true') {
    return true;
  }

  if (envToggle === 'false') {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return LOCAL_HOSTS.has(window.location.hostname);
};

export const getGoogleAuthStatusMessage = () =>
  'Google sign-in is unavailable on this deployment until this domain is added to the Google OAuth authorized JavaScript origins.';
