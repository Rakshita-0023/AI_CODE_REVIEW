import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import { useAuthRestore } from './hooks/useAuthRestore';
import LandingPage from './components/landing/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TestPage from './components/debug/TestPage';
import './styles.css';

const LandingPageWrapper = () => {
  const { isAuthenticated } = useStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LandingPage />;
};

function App() {
  const { theme, login, isAuthenticated, initializeUserData } = useStore();
  const { isRestoring } = useAuthRestore(login, isAuthenticated);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    // Initialize user-specific data after auth restoration is complete
    if (!isRestoring) {
      initializeUserData();
    }
  }, [isRestoring, initializeUserData]);

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Routes>
          <Route path="/" element={<LandingPageWrapper />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#374151',
              color: '#f9fafb',
              border: '1px solid #4b5563',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;