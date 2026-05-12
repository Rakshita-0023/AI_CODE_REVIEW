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
    <div className="bg-[#0b0d10] border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/workspaces')}
            className="btn btn-ghost btn-icon"
            title="Back to Workspaces"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold text-white">{currentProject?.title || 'Untitled Project'}</h1>
          <span className="px-2 py-1 text-xs font-medium bg-white/[0.04] border border-white/12 text-slate-300 rounded-full">
            {currentProject?.language || 'javascript'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                disabled={isAnalyzing}
                className="btn btn-secondary btn-toolbar whitespace-nowrap"
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
            className={`btn btn-toolbar whitespace-nowrap ${
              activePanel === 'scratchpad' 
                ? 'btn-primary' 
                : 'btn-secondary'
            }`}
            title="Notes"
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Notes</span>
            {activePanel === 'scratchpad' && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </button>
          
          <button
            onClick={onToggleAIChat}
            className={`btn btn-toolbar whitespace-nowrap ${
              activePanel === 'ai-chat'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
            title="AI Chat Assistant"
          >
            <SparklesIcon className="w-4 h-4" />
            <span className="text-sm font-medium">AI Chat</span>
            {activePanel === 'ai-chat' && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </button>
          
          <button
            onClick={handleRunCode}
            className="btn btn-primary btn-toolbar whitespace-nowrap"
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
