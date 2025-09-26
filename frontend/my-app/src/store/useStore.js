import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),

      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        // Load user-specific history when logging in
        const userHistoryKey = `codesense_history_user_${user.id}`;
        const userHistory = JSON.parse(localStorage.getItem(userHistoryKey) || '[]');
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          analysisHistory: userHistory
        });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Load guest history when logging out
        const guestHistory = JSON.parse(localStorage.getItem('codesense_history_guest') || '[]');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          analysisHistory: guestHistory
        });
      },

      // Code Editor
      code: '',
      language: 'javascript',
      setCode: (code) => set({ code }),
      setLanguage: (language) => set({ language }),

      // Analysis Results
      currentAnalysis: null,
      analysisHistory: [],
      isAnalyzing: false,
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      addToHistory: (analysis) => set((state) => {
        const newHistory = [analysis, ...state.analysisHistory.slice(0, 49)];
        // Also save to localStorage for persistence with user-specific key
        const storageKey = state.isAuthenticated && state.user?.id 
          ? `codesense_history_user_${state.user.id}` 
          : 'codesense_history_guest';
        console.log('Saving to history:', storageKey, newHistory.length);
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
        return { analysisHistory: newHistory };
      }),
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      
      // Initialize user-specific data
      initializeUserData: () => set((state) => {
        const storageKey = state.isAuthenticated && state.user?.id 
          ? `codesense_history_user_${state.user.id}` 
          : 'codesense_history_guest';
        const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
        console.log('Loading history:', storageKey, history.length);
        return { analysisHistory: history };
      }),

      // Code Execution
      codeOutput: '',
      isRunning: false,
      testResult: null,
      sampleInput: '',
      expectedOutput: '',
      setCodeOutput: (output) => set({ codeOutput: output }),
      setIsRunning: (running) => set({ isRunning: running }),
      setTestResult: (result) => set({ testResult: result }),
      setSampleInput: (input) => set({ sampleInput: input }),
      setExpectedOutput: (output) => set({ expectedOutput: output }),

      // UI State
      activeTab: 'review',
      setActiveTab: (tab) => set({ activeTab: tab }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      showTransition: false,
      setShowTransition: (show) => set({ showTransition: show }),
    }),
    {
      name: 'ai-code-reviewer-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
      }),
    }
  )
);

export default useStore;