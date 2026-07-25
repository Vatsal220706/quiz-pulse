import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const restoreSession = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          const data = await api.get('/auth/me');
          setUser(data.user || data);
        } catch (err) {
          sessionStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const register = async (formData) => {
    try {
      const data = await api.post('/auth/register', formData);
      sessionStorage.setItem('token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const login = async (formData) => {
    try {
      const data = await api.post('/auth/login', formData);
      sessionStorage.setItem('token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };

  const value = { user, loading, error, register, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
