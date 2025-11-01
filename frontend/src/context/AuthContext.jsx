import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    setLoading(true);
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const data = await authService.login(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      setLoading(true);
      const data = await authService.register(username, email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear user state, even if API call fails
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
  };

  // Render a loading screen while checking auth status initially
  if (loading && user === null) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-dark">
            <LoadingSpinner size="lg" />
        </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};