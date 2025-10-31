import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import AnimatedButton from '../components/common/AnimatedButton';
import Toast from '../components/common/Toast';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const validatePassword = () => {
    if (password.length < 8) {
      setToast({ message: 'Password must be at least 8 characters long.', type: 'error' });
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setToast({ message: 'Password must contain at least one uppercase letter.', type: 'error' });
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setToast({ message: 'Password must contain at least one lowercase letter.', type: 'error' });
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setToast({ message: 'Password must contain at least one number.', type: 'error' });
      return false;
    }
    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setToast({ message: 'Invalid reset link. Please request a new one.', type: 'error' });
      return;
    }

    if (!validatePassword()) return;

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password });
      setToast({ message: 'Password reset successful! Redirecting to login...', type: 'success' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again or request a new reset link.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4"
    >
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-dark-accent rounded-lg shadow-lg"
      >
        <div className="text-center">
          <FaLock className="text-5xl text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400 mt-2">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              New Password
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter new password"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400 hover:text-white"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Re-enter new password"
            />
          </div>

          <div className="text-sm text-gray-400 space-y-1">
            <p className="font-medium">Password Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>At least 8 characters long</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
            </ul>
          </div>

          <AnimatedButton 
            type="submit" 
            loading={loading} 
            disabled={loading} 
            variant="primary"
          >
            Reset Password
          </AnimatedButton>
        </form>

        <p className="text-center text-sm text-gray-400">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ResetPasswordPage;
