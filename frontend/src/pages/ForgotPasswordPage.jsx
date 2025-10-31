import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import AnimatedButton from '../components/common/AnimatedButton';
import Toast from '../components/common/Toast';
import { FaEnvelope } from 'react-icons/fa';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setToast({ message: 'Please enter your email address.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      setEmailSent(true);
      setToast({ 
        message: 'Password reset instructions sent! Please check your email.', 
        type: 'success' 
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
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
        {!emailSent ? (
          <>
            <div className="text-center">
              <FaEnvelope className="text-5xl text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white">Forgot Password?</h1>
              <p className="text-gray-400 mt-2">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="your.email@example.com"
                  autoComplete="email"
                />
              </div>

              <AnimatedButton 
                type="submit" 
                loading={loading} 
                disabled={loading} 
                variant="primary"
              >
                Send Reset Link
              </AnimatedButton>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <FaEnvelope className="text-6xl text-green-500 mx-auto" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
            <p className="text-gray-300">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-400">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <AnimatedButton 
              onClick={() => setEmailSent(false)} 
              variant="outline"
            >
              Try Another Email
            </AnimatedButton>
          </div>
        )}

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

export default ForgotPasswordPage;
