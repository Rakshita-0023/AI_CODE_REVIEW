import { useEffect } from 'react';
import WelcomeAnimation from './WelcomeAnimation';

const TransitionAnimation = ({ isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      // Auto-complete after 3 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 dark:bg-[#0B0B0F] bg-slate-50 flex items-center justify-center z-[9999]">
      {/* Dark Theme Background Effects */}
      <div className="fixed inset-0 overflow-hidden dark:block hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-full blur-3xl animate-bounce" style={{animationDuration: '6s'}}></div>
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0B0B0F] to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>
      </div>
      
      {/* Light Theme Background */}
      <div className="fixed inset-0 dark:hidden block bg-gradient-to-br from-slate-50 via-white to-slate-100"></div>
      <div className="text-center">
        <div className="w-80 h-80 mb-8">
          <WelcomeAnimation />
        </div>
        <div className="dark:text-white text-slate-800 relative z-10">
          <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
          <p className="text-lg opacity-80">Setting up your dashboard...</p>
        </div>
      </div>
    </div>
  );
};

export default TransitionAnimation;