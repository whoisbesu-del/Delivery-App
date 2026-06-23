import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requiresVerification, setRequiresVerification] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('south_token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then(({ user }) => { setUser(user); setRequiresVerification(!user.emailVerified); })
      .catch(() => localStorage.removeItem('south_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('south_token', data.token);
    setUser(data.user);
    setRequiresVerification(data.requiresVerification || !data.user.emailVerified);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    localStorage.setItem('south_token', data.token);
    setUser(data.user);
    setRequiresVerification(true);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('south_token');
    setUser(null);
    setRequiresVerification(false);
  }, []);

  const markVerified = useCallback(() => {
    setRequiresVerification(false);
    setUser(u => u ? { ...u, emailVerified: true } : u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, requiresVerification, login, register, logout, markVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
