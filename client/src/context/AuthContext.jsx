import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe as getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await getCurrentUser();
        setUser(data.data || data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const loginUser = async (credentials) => {
    const data = await apiLogin(credentials);
    const result = data.data || data;
    const accessToken = result.access_token || result.accessToken;
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
    const userData = result.user || result;
    
    try {
      const meData = await getCurrentUser();
      setUser(meData.data || meData);
    } catch {
      setUser(userData);
    }
    return userData;
  };

  const registerUser = async (credentials) => {
    const data = await apiRegister(credentials);
    const result = data.data || data;
    const accessToken = result.access_token || result.accessToken;
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
    const userData = result.user || result;

    try {
      const meData = await getCurrentUser();
      setUser(meData.data || meData);
    } catch {
      setUser(userData);
    }
    return userData;
  };

  const logoutUser = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const hasRole = (roleName) => {
    if (!user) return false;
    if (user.role?.name === roleName || user.role === roleName) return true;
    return false;
  };

  const hasPermission = (permissionSlug) => {
    if (!user) return false;
    if (user.role?.name === 'admin' || user.role === 'admin') return true;
    const permissions = user.permissions || user.role?.permissions || [];
    return permissions.some(p => (typeof p === 'string' ? p === permissionSlug : p.slug === permissionSlug || p.name === permissionSlug));
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logoutUser, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

