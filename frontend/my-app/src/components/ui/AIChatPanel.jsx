import { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  XMarkIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { aiAPI } from '../../services/api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const AIChatPanel = ({ onClose }) => {
  const { code, language, currentProject } = useStore();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 1,
      type: 'ai',
      content: 'Hi! I\'m your AI coding assistant. I can help you with your code, answer questions, and provide suggestions. I can see your current code, so feel free to ask me anything about it!',
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiAPI.chat({
        message: inputMessage,
        codeContext: code,
        workspaceId: currentProject?.id
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
      const apiError = error?.response?.data?.error;
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: apiError ? `Request failed: ${apiError}` : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#080a0d] text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-indigo-300" />
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-[rgba(99,102,241,0.25)] border border-indigo-400/30 text-white'
                  : 'bg-white/[0.03] border border-white/10 text-slate-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-[#0b0d10]">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about your code..."
            className="flex-1 bg-[#12161d] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
        
        {code && (
          <p className="text-xs text-gray-500 mt-2">
            💡 I can see your current {language} code and help you with it
          </p>
        )}
      </div>
    </div>
  );
};

export default AIChatPanel;
