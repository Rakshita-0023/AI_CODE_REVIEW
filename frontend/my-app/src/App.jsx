import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useStore from './store/useStore';
import { useAuthRestore } from './hooks/useAuthRestore';
import LandingPage from './components/landing/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/NewDashboardPage';
import WorkspacesPage from './pages/WorkspacesPage';
import ScratchpadPage from './pages/ScratchpadPage';
import AIChatPage from './pages/AIChatPage';
import HistoryPage from './pages/HistoryPage';
import NotesPage from './pages/NotesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import TrashPage from './pages/TrashPage';
import EditorPage from './pages/EditorPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import TestPage from './components/debug/TestPage';
import { getGoogleAuthConfig } from './utils/googleAuth';
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
  const googleAuth = getGoogleAuthConfig();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    // Initialize user-specific data after auth restoration is complete
    if (!isRestoring) {
      initializeUserData();
    }
  }, [isRestoring, initializeUserData]);

  const appRoutes = (
      <Router>
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Routes>
          <Route path="/" element={<LandingPageWrapper />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workspaces" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WorkspacesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scratchpads" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ScratchpadPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-chat" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AIChatPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notes" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NotesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trash" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TrashPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/editor/:projectId" 
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#374151',
              color: '#f9fafb',
              border: '1px solid #4b5563',
              marginBottom: '80px',
            },
          }}
        />
        </div>
      </Router>
  );

  return googleAuth.enabled ? (
    <GoogleOAuthProvider clientId={googleAuth.clientId}>
      {appRoutes}
    </GoogleOAuthProvider>
  ) : (
    appRoutes
  );
}

export default App;
