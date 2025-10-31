import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import AnimatedButton from '../components/common/AnimatedButton';
import Toast from '../components/common/Toast';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email for the correct link.');
        return;
      }

      try {
        const response = await api.get(`/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully! You can now log in.');
        setToast({ message: 'Email verified! Redirecting to login...', type: 'success' });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. Please try again or request a new verification email.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendEmail = async () => {
    // This would require the user's email, so we might need to redirect to a resend page
    setToast({ message: 'Feature coming soon. Please contact support if needed.', type: 'info' });
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
        className="w-full max-w-md p-8 space-y-6 bg-dark-accent rounded-lg shadow-lg text-center"
      >
        {status === 'verifying' && (
          <>
            <FaSpinner className="text-6xl text-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-bold text-white">Verifying Your Email...</h1>
            <p className="text-gray-400">Please wait while we verify your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <FaCheckCircle className="text-6xl text-green-500 mx-auto" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
            <p className="text-gray-300">{message}</p>
            <p className="text-sm text-gray-400">Redirecting you to login page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <FaTimesCircle className="text-6xl text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
            <p className="text-gray-300">{message}</p>
            <div className="space-y-3 mt-6">
              <AnimatedButton onClick={() => navigate('/login')} variant="primary">
                Go to Login
              </AnimatedButton>
              <AnimatedButton onClick={handleResendEmail} variant="outline">
                Resend Verification Email
              </AnimatedButton>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default VerifyEmailPage;
