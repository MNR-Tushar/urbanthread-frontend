import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import AuthContext from './context';

const readCachedUser = () => {
  if (!localStorage.getItem('access_token')) return null;
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readCachedUser);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('access_token') && localStorage.getItem('user')));

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('access_token');
    if (token && localStorage.getItem('user')) {
      authAPI.getUser().then(({ data }) => {
          if (!active) return;
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
        }).catch(() => {
          if (!localStorage.getItem('access_token') && active) setUser(null);
        }).finally(() => {
          if (active) setLoading(false);
        });
    }
    const expireSession = () => { if (active) { setUser(null); setLoading(false); } };
    window.addEventListener('urbanthread:auth-expired', expireSession);
    return () => {
      active = false;
      window.removeEventListener('urbanthread:auth-expired', expireSession);
    };
  }, []);

  const acceptSession = useCallback((data) => {
    const { tokens, ...userData } = data;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authAPI.login({ email, password });
    return acceptSession(response.data);
  }, [acceptSession]);

  const register = useCallback(async (data) => {
    const response = await authAPI.register(data);
    return response.data;
  }, []);

  const verifyEmail = useCallback(async (email, otp) => {
    const response = await authAPI.verifyEmail({ email, otp });
    return acceptSession(response.data);
  }, [acceptSession]);

  const googleSignIn = useCallback(async (credential) => {
    const response = await authAPI.googleSignIn(credential);
    return acceptSession(response.data);
  }, [acceptSession]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch {}
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const response = await authAPI.updateUser(data);
    localStorage.setItem('user', JSON.stringify(response.data));
    setUser(response.data);
    return response.data;
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    verifyEmail,
    googleSignIn,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
