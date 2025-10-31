import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import AnimatedButton from '../components/common/AnimatedButton';
import Toast from '../components/common/Toast';
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  const { register, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Real-time password strength checker
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);

  const validateForm = () => {
    // Username validation
    if (username.length < 3 || username.length > 20) {
      setToast({ message: 'Username must be 3-20 characters long.', type: 'error' });
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setToast({ message: 'Username can only contain letters, numbers, and underscores.', type: 'error' });
      return false;
    }

    // Reserved usernames
    const reservedWords = ['admin', 'root', 'moderator', 'system', 'domino', 'arena', 'support', 'help'];
    if (reservedWords.includes(username.toLowerCase())) {
      setToast({ message: 'This username is reserved and cannot be used.', type: 'error' });
      return false;
    }

    // Email validation (basic)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({ message: 'Please enter a valid email address.', type: 'error' });
      return false;
    }

    // Password strength validation
    if (!passwordStrength.length) {
      setToast({ message: 'Password must be at least 8 characters long.', type: 'error' });
      return false;
    }
    if (!passwordStrength.uppercase) {
      setToast({ message: 'Password must contain at least one uppercase letter.', type: 'error' });
      return false;
    }
    if (!passwordStrength.lowercase) {
      setToast({ message: 'Password must contain at least one lowercase letter.', type: 'error' });
      return false;
    }
    if (!passwordStrength.number) {
      setToast({ message: 'Password must contain at least one number.', type: 'error' });
      return false;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
      setToast({ message: 'Registration successful! Please check your email to verify your account.', type: 'success' });
      // Don't navigate yet - wait for email verification
    } catch (error) {
      // Backend will send specific error messages
      setToast({ message: error.message, type: 'error' });
    }
  };

  const PasswordRequirement = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-500' : 'text-gray-400'}`}>
      {met ? <FaCheckCircle /> : <FaTimesCircle />}
      <span>{text}</span>
    </div>
  );

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
        <h1 className="text-3xl font-bold text-center text-white">Create Your Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Choose a username (3-20 characters)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="your.email@example.com"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Create a strong password"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="p-3 bg-dark rounded-md space-y-2">
              <p className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</p>
              <PasswordRequirement met={passwordStrength.length} text="At least 8 characters" />
              <PasswordRequirement met={passwordStrength.uppercase} text="One uppercase letter (A-Z)" />
              <PasswordRequirement met={passwordStrength.lowercase} text="One lowercase letter (a-z)" />
              <PasswordRequirement met={passwordStrength.number} text="One number (0-9)" />
              <PasswordRequirement met={passwordStrength.special} text="One special character (!@#$%...)" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Re-enter your password"
            />
          </div>
          
          <AnimatedButton type="submit" loading={loading} disabled={loading} variant="primary">
            Sign Up
          </AnimatedButton>
        </form>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RegisterPage;
