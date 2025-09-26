import { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';

const AIChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI coding assistant. I can help you with code review, debugging, best practices, and answer any programming questions you have. What would you like to know?"
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
      const response = await aiAPI.chat(currentInput);
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response || 'Sorry, I encountered an error. Please try again.'
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I\'m having trouble connecting. Please check your internet connection and try again.'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const getAIResponse = (question) => {
    const lowerInput = question.toLowerCase();
    const words = lowerInput.split(' ');
    
    // Check for code-related keywords and provide specific help
    const codeKeywords = ['function', 'variable', 'loop', 'array', 'object', 'class', 'method'];
    const hasCodeKeyword = codeKeywords.some(keyword => lowerInput.includes(keyword));
    
    // Analyze the question for intent
    const isQuestion = question.includes('?') || words.some(w => ['what', 'how', 'why', 'when', 'where', 'which'].includes(w));
    const isRequest = words.some(w => ['help', 'show', 'explain', 'teach', 'create', 'make', 'build'].includes(w));
    const isProblem = words.some(w => ['error', 'bug', 'issue', 'problem', 'broken', 'not working'].includes(w));
    
    // Greeting responses
    if (lowerInput.match(/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/)) {
      const greetings = [
        "Hello! I'm here to help you with all your coding questions. What are you working on today?",
        "Hi there! Ready to dive into some code? What can I help you with?",
        "Hey! I'm your coding assistant. Whether it's debugging, optimization, or learning new concepts, I'm here to help!",
        "Welcome! I can help you with code review, debugging, best practices, and more. What's your challenge?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Specific programming help requests
    if (isProblem) {
      return "I can help you solve that! 🔧\n\nTo provide the best solution:\n\n1. **Share your code** - paste the problematic code\n2. **Describe the issue** - what's not working?\n3. **Expected vs Actual** - what should happen vs what's happening?\n4. **Error messages** - any error messages you're seeing?\n\nI'll analyze it and provide a fix!";
    }
    
    if (hasCodeKeyword && isQuestion) {
      return "Great coding question! 💻\n\nI can explain:\n• **Syntax** - how to write it correctly\n• **Logic** - how it works under the hood\n• **Best practices** - the right way to do it\n• **Examples** - practical code samples\n\nWhat specific aspect would you like me to explain?";
    }
    
    if (isRequest && hasCodeKeyword) {
      return "I'd love to help you build that! 🚀\n\nLet me know:\n• What programming language?\n• What should it do?\n• Any specific requirements?\n\nI'll provide step-by-step guidance and code examples!";
    }
    
    // Debugging help
    if (lowerInput.match(/\b(debug|bug|error|fix|broken|not working|issue|problem)\b/)) {
      return "I'd love to help you debug! 🐛\n\nTo give you the best assistance:\n1. Share your code snippet\n2. Describe what you expected vs what's happening\n3. Include any error messages\n\nWhat programming language are you using?";
    }
    
    // Code review
    if (lowerInput.match(/\b(review|check|improve|better|optimize|clean)\b/)) {
      return "Great! I can help review your code for:\n\n✅ Logic errors\n✅ Performance issues\n✅ Best practices\n✅ Security vulnerabilities\n✅ Code style\n\nPaste your code and I'll give you detailed feedback!";
    }
    
    // Learning/explanation
    if (lowerInput.match(/\b(learn|explain|how|what|why|understand|teach)\b/)) {
      return "I love helping people learn! 📚\n\nI can explain:\n• Programming concepts\n• Language features\n• Algorithms & data structures\n• Design patterns\n• Best practices\n\nWhat would you like to learn about?";
    }
    
    // Performance optimization
    if (lowerInput.match(/\b(performance|optimize|faster|slow|speed|efficient)\b/)) {
      return "Let's make your code lightning fast! ⚡\n\nI can help with:\n• Algorithm optimization\n• Memory usage\n• Database queries\n• Caching strategies\n• Profiling techniques\n\nShare your code and I'll suggest improvements!";
    }
    
    // Security
    if (lowerInput.match(/\b(security|secure|vulnerability|injection|auth|encrypt)\b/)) {
      return "Security is crucial! 🔒\n\nI can help you with:\n• Input validation\n• SQL injection prevention\n• Authentication & authorization\n• Data encryption\n• Secure coding practices\n\nWhat security concern do you have?";
    }
    
    // Specific languages
    if (lowerInput.match(/\b(javascript|js|react|node)\b/)) {
      return "JavaScript! 🚀 One of my favorites!\n\nI can help with:\n• ES6+ features\n• React/Vue/Angular\n• Node.js\n• Async/await\n• DOM manipulation\n\nWhat JavaScript topic interests you?";
    }
    
    if (lowerInput.match(/\b(python|py|django|flask)\b/)) {
      return "Python! 🐍 Such an elegant language!\n\nI can assist with:\n• Data structures & algorithms\n• Web frameworks (Django/Flask)\n• Data science libraries\n• Automation scripts\n• Best practices\n\nWhat Python challenge are you facing?";
    }
    
    // General coding questions
    if (lowerInput.match(/\b(code|coding|program|programming|develop|software)\b/)) {
      return "I'm here to help with all things coding! 💻\n\nPopular topics I can help with:\n• Debugging & troubleshooting\n• Code reviews & optimization\n• Learning new concepts\n• Best practices\n• Architecture decisions\n\nWhat's on your mind?";
    }
    
    // Code-specific help
    if (lowerInput.match(/\b(function|method|class|variable|array|object|loop|condition)\b/)) {
      return "I can help you with that! 💻\n\nFor better assistance:\n• Share your code snippet\n• Describe what you're trying to achieve\n• Mention any specific issues you're facing\n\nI can help with syntax, logic, optimization, and best practices!";
    }
    
    // Algorithm and data structure help
    if (lowerInput.match(/\b(algorithm|sorting|searching|tree|graph|hash|stack|queue)\b/)) {
      return "Algorithms and data structures! 🧠\n\nI can help you with:\n• Time & space complexity analysis\n• Choosing the right data structure\n• Algorithm implementation\n• Optimization techniques\n\nWhat specific algorithm or data structure are you working with?";
    }
    
    // Error handling
    if (lowerInput.match(/\b(error|exception|crash|fail|broken)\b/)) {
      return "Let's fix that error! 🔧\n\nTo help you effectively:\n1. Share the error message\n2. Show the problematic code\n3. Describe what you expected to happen\n\nI'll analyze the issue and provide a solution!";
    }
    
    // Testing help
    if (lowerInput.match(/\b(test|testing|unit test|integration|mock)\b/)) {
      return "Testing is crucial for reliable code! ✅\n\nI can help with:\n• Writing unit tests\n• Test-driven development (TDD)\n• Mocking and stubbing\n• Integration testing\n• Testing frameworks\n\nWhat kind of testing do you need help with?";
    }
    
    // Database help
    if (lowerInput.match(/\b(database|sql|query|table|join|index)\b/)) {
      return "Database questions! 🗄\n\nI can assist with:\n• SQL query optimization\n• Database design\n• Indexing strategies\n• Joins and relationships\n• Performance tuning\n\nWhat database challenge are you facing?";
    }
    
    // API and web development
    if (lowerInput.match(/\b(api|rest|graphql|endpoint|http|request|response)\b/)) {
      return "API development! 🌐\n\nI can help with:\n• RESTful API design\n• GraphQL implementation\n• Authentication & authorization\n• Error handling\n• API documentation\n\nWhat API topic interests you?";
    }
    
    // Conversational responses with more personality
    const conversationalResponses = [
      "I'm here to help you code better! 🚀 What programming challenge can I assist you with today?",
      "Great to chat with you! 👋 I specialize in helping developers solve coding problems. What's on your mind?",
      "I love helping developers! 💻 Whether it's debugging, optimization, or learning new concepts, I'm here for you. What do you need help with?",
      "Ready to tackle some code together? 🔥 I can help with debugging, code review, best practices, and more. What's your current challenge?",
      "Let's make your code awesome! ✨ I can assist with everything from syntax errors to architecture decisions. What would you like to work on?"
    ];
    
    return conversationalResponses[Math.floor(Math.random() * conversationalResponses.length)];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-6 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-96 h-[500px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.type === 'user'
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
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              placeholder="Ask me anything about coding..."
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
        </div>
      </div>
    </div>
  );
};

export default AIChat;