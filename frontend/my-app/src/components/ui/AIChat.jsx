import { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

const AIChat = ({ isOpen, onClose, codeContext = '' }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI coding assistant powered by Gemini 2.5 Flash. I can help you with code review, debugging, optimization, and answer any programming questions. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const { aiAPI } = await import('../../services/api');
      const response = await aiAPI.chat({ 
        message: currentInput, 
        codeContext: codeContext 
      });

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response || 'Sorry, I encountered an error. Please try again.'
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackResponse = getAIResponse(currentInput);
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: fallbackResponse
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setLoading(false);
    }
  };

  const getAIResponse = (question) => {
    const lowerInput = question.toLowerCase();
    
    // Enhanced AI responses with more context awareness
    if (lowerInput.match(/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/)) {
      return "Hello! I'm here to help you with all your coding questions. I can analyze your code, suggest improvements, debug issues, and explain programming concepts. What are you working on?";
    }

    if (lowerInput.match(/\b(debug|bug|error|fix|broken|not working|issue|problem)\b/)) {
      return `I'd love to help you debug! 🐛\n\n${codeContext ? 'I can see your code context. ' : ''}To give you the best assistance:\n\n1. Describe what you expected vs what's happening\n2. Share any error messages you're seeing\n3. Let me know what programming language you're using\n\nI'll analyze the issue and provide a solution!`;
    }

    if (lowerInput.match(/\b(review|check|improve|better|optimize|clean)\b/)) {
      return `Great! I can help review your code for:\n\n✅ Logic errors and bugs\n✅ Performance optimizations\n✅ Best practices and patterns\n✅ Security vulnerabilities\n✅ Code readability\n\n${codeContext ? 'I can see your current code. ' : ''}What specific aspect would you like me to focus on?`;
    }

    if (lowerInput.match(/\b(performance|optimize|faster|slow|speed|efficient)\b/)) {
      return `Let's make your code lightning fast! ⚡\n\n${codeContext ? 'Looking at your code, ' : ''}I can help with:\n\n• Algorithm optimization\n• Memory usage improvements\n• Database query optimization\n• Caching strategies\n• Code profiling techniques\n\nWhat performance issues are you experiencing?`;
    }

    if (lowerInput.match(/\b(explain|how|what|why|understand|teach|learn)\b/)) {
      return `I love helping people learn! 📚\n\n${codeContext ? 'I can explain your current code or ' : ''}I can help with:\n\n• Programming concepts and patterns\n• Language-specific features\n• Algorithms and data structures\n• Best practices and conventions\n• Code architecture decisions\n\nWhat would you like me to explain?`;
    }

    // Language-specific responses
    if (lowerInput.match(/\b(javascript|js|react|node|typescript|ts)\b/)) {
      return `JavaScript/TypeScript! 🚀\n\n${codeContext ? 'I can see your JS/TS code. ' : ''}I can help with:\n\n• Modern ES6+ features\n• React/Vue/Angular patterns\n• Node.js backend development\n• Async/await and promises\n• TypeScript type safety\n\nWhat JavaScript challenge are you facing?`;
    }

    if (lowerInput.match(/\b(python|py|django|flask|pandas)\b/)) {
      return `Python! 🐍\n\n${codeContext ? 'Looking at your Python code, ' : ''}I can assist with:\n\n• Pythonic code patterns\n• Web frameworks (Django/Flask)\n• Data science libraries\n• Automation and scripting\n• Performance optimization\n\nWhat Python topic interests you?`;
    }

    // Default intelligent response
    return `I'm here to help with your coding questions! 💻\n\n${codeContext ? 'I can see you have some code context. ' : ''}Popular topics I can help with:\n\n• Code debugging and troubleshooting\n• Performance optimization\n• Best practices and patterns\n• Code reviews and improvements\n• Algorithm explanations\n\nWhat specific challenge are you working on?`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-6 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-96 h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-gray-400">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Code Context Indicator */}
        {codeContext && (
          <div className="px-4 py-2 bg-purple-900/20 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <CodeBracketIcon className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400">Code context available ({codeContext.length} chars)</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${message.type === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300'
                  }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 p-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me about your code..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-2 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          
          {codeContext && (
            <div className="mt-2 text-xs text-purple-400">
              💡 I can see your code and will provide context-aware help
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat;