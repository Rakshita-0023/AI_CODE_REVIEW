import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../services/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import TransitionAnimation from '../components/ui/TransitionAnimation';

const SignInPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, showTransition, setShowTransition } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with:', { email: formData.email, password: '***' });
      
      // Check if it's a demo account first
      if (formData.email === 'demo@codesense.com' && formData.password === 'demo123') {
        const demoUser = {
          id: 'demo-user',
          username: 'Demo User',
          email: 'demo@codesense.com',
          preferences: { theme: 'dark', language: 'en' }
        };
        const demoToken = 'demo-token-' + Date.now();
        localStorage.setItem('token', demoToken);
        localStorage.setItem('user', JSON.stringify(demoUser));
        login(demoUser, demoToken);
        toast.success('Welcome to CodeSense Demo!');
        setShowTransition(true);
        return;
      }

      // Check localStorage for existing user
      const storedUsers = JSON.parse(localStorage.getItem('codesense_users') || '[]');
      const existingUser = storedUsers.find(u => u.email === formData.email);
      
      if (existingUser) {
        if (existingUser.password === formData.password) {
          const token = 'local-token-' + Date.now();
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(existingUser));
          login(existingUser, token);
          toast.success(`Welcome back, ${existingUser.username}!`);
          setShowTransition(true);
          return;
        } else {
          toast.error('Invalid password');
          setLoading(false);
          return;
        }
      }
      
      // Try API login
      try {
        const response = await authAPI.login(formData.email, formData.password);
        console.log('Login response:', response.data);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        login(response.data.user, response.data.token);
        toast.success(response.data.message || 'Welcome back!');
        setShowTransition(true);
      } catch (apiError) {
        console.error('API Login error:', apiError);
        
        if (apiError.response?.status === 404 || apiError.response?.data?.needsSignup) {
          toast.error("You don't have an account. Please sign up first.");
        } else if (apiError.code === 'NETWORK_ERROR' || apiError.message.includes('Network Error')) {
          toast.error("You don't have an account. Please sign up first.");
        } else {
          const errorMessage = apiError.response?.data?.error || 'Sign in failed';
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <>
      <TransitionAnimation 
        isVisible={showTransition} 
        onComplete={handleTransitionComplete} 
      />
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">CS</span>
            </div>
            <span className="text-2xl font-bold">CodeSense</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your account to continue</p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
              <p className="text-purple-300 text-sm font-medium mb-1">Demo Account</p>
              <p className="text-gray-400 text-xs">Email: demo@codesense.com</p>
              <p className="text-gray-400 text-xs">Password: demo123</p>
            </div>
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default SignInPage;