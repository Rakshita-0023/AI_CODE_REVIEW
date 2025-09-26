import { useState, useEffect } from 'react';
import { UserPlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';

const WelcomePrompt = ({ onOpenAuth }) => {
  const { isAuthenticated } = useStore();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show welcome prompt if user is not authenticated and hasn't dismissed it
    const hasSeenPrompt = localStorage.getItem('hasSeenWelcomePrompt');
    if (!isAuthenticated && !hasSeenPrompt) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('hasSeenWelcomePrompt', 'true');
  };

  const handleSignUp = () => {
    setShowPrompt(false);
    onOpenAuth('register');
  };

  if (!showPrompt || isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <div className="flex items-start space-x-3">
        <UserPlusIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Welcome to AI Code Reviewer!</h3>
          <p className="text-xs mt-1 opacity-90">
            Sign up to save your analysis history and personalize your experience.
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleSignUp}
              className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 hover:bg-gray-100"
            >
              <span>Sign Up</span>
              <ArrowRightIcon className="w-3 h-3" />
            </button>
            <button
              onClick={handleDismiss}
              className="text-white opacity-75 hover:opacity-100 text-xs px-2 py-1"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePrompt;