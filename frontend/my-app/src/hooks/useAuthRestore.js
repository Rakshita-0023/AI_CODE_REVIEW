import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';

export const useAuthRestore = (login, isAuthenticated) => {
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser || isAuthenticated) return;

      setIsRestoring(true);
      
      try {
        const user = JSON.parse(storedUser);
        login(user, token);
      } catch (error) {
        if (token.startsWith('eyJ')) {
          try {
            const response = await authAPI.getProfile();
            login(response.data.user, token);
          } catch (apiError) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        setIsRestoring(false);
      }
    };

    restoreAuth();
  }, [login, isAuthenticated]);

  return { isRestoring };
};