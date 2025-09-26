import { useState } from 'react';
import useStore from '../../store/useStore';

const TestPage = () => {
  const { isAuthenticated, user, login, logout } = useStore();
  const [testCode, setTestCode] = useState('console.log("Hello World");');

  const handleTestLogin = () => {
    const testUser = {
      id: 'test-user',
      username: 'Test User',
      email: 'test@example.com',
      preferences: { theme: 'dark', language: 'en' }
    };
    const testToken = 'test-token-' + Date.now();
    localStorage.setItem('token', testToken);
    localStorage.setItem('user', JSON.stringify(testUser));
    login(testUser, testToken);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CodeSense Debug Page</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Authentication Test */}
          <div className="bg-gray-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-4">
              <p>Authenticated: <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>{isAuthenticated ? 'Yes' : 'No'}</span></p>
              {user && (
                <div>
                  <p>User: {user.username}</p>
                  <p>Email: {user.email}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleTestLogin}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Test Login
                </button>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Code Test */}
          <div className="bg-gray-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Code Test</h2>
            <textarea
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              className="w-full h-32 bg-gray-800 text-white p-3 rounded border border-gray-700"
              placeholder="Enter test code..."
            />
            <button
              onClick={() => console.log('Test code:', testCode)}
              className="mt-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Test Code
            </button>
          </div>
        </div>

        {/* Navigation Test */}
        <div className="mt-8 bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
          <div className="flex gap-4">
            <a href="/" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
              Landing Page
            </a>
            <a href="/signin" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Sign In
            </a>
            <a href="/signup" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
              Sign Up
            </a>
            <a href="/dashboard" className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded">
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;