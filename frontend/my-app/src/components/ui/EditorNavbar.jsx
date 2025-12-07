import { PlayIcon, SparklesIcon } from '@heroicons/react/24/solid';
import {
  DocumentMagnifyingGlassIcon,
  BugAntIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EditorNavbar = ({ onToggleAIChat, onToggleScratchpad, activePanel }) => {
  const navigate = useNavigate();
  const {
    code,
    language,
    currentProject,
    setCurrentAnalysis,
    addToHistory,
    isAnalyzing,
    setIsAnalyzing
  } = useStore();

  const handleAnalysis = async (type) => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }

    setCurrentAnalysis(null);
    setIsAnalyzing(true);

    try {
      let response;
      const payload = { code, language };

      const payloadWithWorkspace = { ...payload, workspaceId: currentProject?.id };
      
      switch (type) {
        case 'review':
          response = await aiAPI.reviewCode(payloadWithWorkspace);
          break;
        case 'debug':
          response = await aiAPI.debugCode(payloadWithWorkspace);
          break;
        case 'approaches':
          response = await aiAPI.getApproaches(payloadWithWorkspace);
          break;
        case 'optimize':
          response = await aiAPI.optimizeCode(payloadWithWorkspace);
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      const analysis = {
        ...response.data,
        type,
        timestamp: new Date().toISOString(),
        originalCode: code,
      };

      setCurrentAnalysis(analysis);
      addToHistory(analysis);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} completed!`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(`${type.charAt(0).toUpperCase() + type.slice(1)} failed. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunCode = () => {
    document.dispatchEvent(new CustomEvent('runCode'));
  };

  const navItems = [
    {
      id: 'review',
      label: 'Review Code',
      icon: DocumentMagnifyingGlassIcon,
      onClick: () => handleAnalysis('review')
    },
    {
      id: 'debug',
      label: 'Debug & Fix',
      icon: BugAntIcon,
      onClick: () => handleAnalysis('debug')
    },
    {
      id: 'approaches',
      label: 'Different Approaches',
      icon: LightBulbIcon,
      onClick: () => handleAnalysis('approaches')
    },
    {
      id: 'optimize',
      label: 'Optimize Performance',
      icon: RocketLaunchIcon,
      onClick: () => handleAnalysis('optimize')
    }
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/workspaces')}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
            title="Back to Workspaces"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">{currentProject?.title || 'Untitled Project'}</h1>
          <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
            {currentProject?.language || 'javascript'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
                {isAnalyzing && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </button>
            );
          })}
          
          <button
            onClick={onToggleScratchpad}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              activePanel === 'scratchpad' 
                ? 'bg-gray-700 hover:bg-gray-800 border border-gray-500' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title="Notes"
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Notes</span>
            {activePanel === 'scratchpad' && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </button>
          
          <button
            onClick={onToggleAIChat}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activePanel === 'ai-chat'
                ? 'bg-gradient-to-r from-purple-700 to-blue-700 shadow-lg shadow-purple-500/50'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25'
            }`}
            title="AI Chat Assistant"
          >
            <SparklesIcon className="w-4 h-4" />
            <span className="text-sm font-medium">AI Chat</span>
            {activePanel === 'ai-chat' && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </button>
          
          <button
            onClick={handleRunCode}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-200"
            title="Run Code (Ctrl+Enter)"
          >
            <PlayIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorNavbar;