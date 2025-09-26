import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../services/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import TransitionAnimation from '../components/ui/TransitionAnimation';

const SignUpPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, showTransition, setShowTransition } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting registration with:', { 
        username: formData.username, 
        email: formData.email, 
        password: '***' 
      });

      // Validation
      if (!formData.username || !formData.email || !formData.password) {
        toast.error('All fields are required');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Check localStorage for existing users
      const storedUsers = JSON.parse(localStorage.getItem('codesense_users') || '[]');
      const existingUser = storedUsers.find(u => u.email === formData.email || u.username === formData.username);
      
      if (existingUser) {
        if (existingUser.email === formData.email) {
          toast.error('Email already registered. Please sign in instead.');
        } else {
          toast.error('Username already taken. Please choose another.');
        }
        setLoading(false);
        return;
      }

      // Create new user object
      const newUser = {
        id: 'user-' + Date.now(),
        username: formData.username,
        email: formData.email,
        password: formData.password, // In production, this should be hashed
        preferences: { theme: 'dark', language: 'en' },
        createdAt: new Date().toISOString()
      };

      // Try API registration first
      try {
        const response = await authAPI.register(formData.username, formData.email, formData.password);
        console.log('Registration response:', response.data);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Also store in local users array for offline access
        storedUsers.push(newUser);
        localStorage.setItem('codesense_users', JSON.stringify(storedUsers));
        
        login(response.data.user, response.data.token);
        toast.success(response.data.message || 'Account created successfully!');
        setShowTransition(true);
      } catch (apiError) {
        console.error('API Registration error:', apiError);
        
        // Fallback to localStorage registration
        console.log('Using localStorage fallback for registration');
        
        // Store user locally
        storedUsers.push(newUser);
        localStorage.setItem('codesense_users', JSON.stringify(storedUsers));
        
        const token = 'local-token-' + Date.now();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        login(newUser, token);
        toast.success('Account created successfully!');
        setShowTransition(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Sign up failed. Please try again.');
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
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-400">Start your journey with AI-powered code review</p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Choose a username"
              />
            </div>

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
                  placeholder="Create a password"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/signin" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
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

export default SignUpPage;