import { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, PlusIcon, ChatBubbleLeftRightIcon, TrashIcon, SparklesIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { aiAPI } from '../services/api';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { moveToTrash } from '../utils/trashUtils';
import toast from 'react-hot-toast';

const AIChatPage = () => {
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeContext, setCodeContext] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, sessionId: null, sessionName: '' });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('aiChatSessions') || '[]');
    setChatSessions(savedSessions);
    
    if (savedSessions.length > 0) {
      setCurrentSession(savedSessions[0]);
      setMessages(savedSessions[0].messages);
    } else {
      createNewChat();
    }
  }, []);

  const createNewChat = () => {
    const newSession = {
      id: Date.now(),
      title: 'New Chat',
      messages: [{ 
        id: 1, 
        type: 'ai', 
        content: 'Hello! I\'m your AI coding assistant powered by Gemini 2.5 Flash. I can help you with:\n\n• Code review and debugging\n• Performance optimization\n• Best practices and patterns\n• Algorithm explanations\n• Language-specific questions\n\nWhat would you like to work on today?', 
        timestamp: new Date().toISOString() 
      }],
      createdAt: new Date().toISOString()
    };
    
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    setCurrentSession(newSession);
    setMessages(newSession.messages);
    localStorage.setItem('aiChatSessions', JSON.stringify(updatedSessions));
  };

  const selectChat = (session) => {
    setCurrentSession(session);
    setMessages(session.messages);
  };

  const handleDeleteClick = (sessionId, sessionName) => {
    setDeleteModal({ isOpen: true, sessionId, sessionName });
  };

  const confirmDelete = () => {
    const { sessionId } = deleteModal;
    const sessionToDelete = chatSessions.find(s => s.id === sessionId);
    
    if (sessionToDelete) {
      // Move to trash
      moveToTrash(sessionToDelete, 'chat');
      
      // Remove from current sessions
      const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
      setChatSessions(updatedSessions);
      localStorage.setItem('aiChatSessions', JSON.stringify(updatedSessions));
      
      // Handle current session
      if (currentSession?.id === sessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSession(updatedSessions[0]);
          setMessages(updatedSessions[0].messages);
        } else {
          setCurrentSession(null);
          setMessages([]);
          // Don't create new chat automatically
        }
      }
      
      toast.success('Chat session moved to trash');
    }
    
    setDeleteModal({ isOpen: false, sessionId: null, sessionName: '' });
  };

  const updateCurrentSession = (newMessages) => {
    if (!currentSession) return;
    
    const updatedSession = { 
      ...currentSession, 
      messages: newMessages,
      title: newMessages.length > 1 ? newMessages[1].content.slice(0, 30) + '...' : 'New Chat'
    };
    const updatedSessions = chatSessions.map(s => 
      s.id === currentSession.id ? updatedSession : s
    );
    
    setChatSessions(updatedSessions);
    setCurrentSession(updatedSession);
    localStorage.setItem('aiChatSessions', JSON.stringify(updatedSessions));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { 
      id: Date.now(), 
      type: 'user', 
      content: input,
      codeContext: codeContext || null,
      timestamp: new Date().toISOString() 
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateCurrentSession(newMessages);
    
    const currentInput = input;
    const currentCodeContext = codeContext;
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await aiAPI.chat({ 
        message: currentInput, 
        codeContext: currentCodeContext 
      });
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      updateCurrentSession(finalMessages);
      
      toast.success('Response received!');
    } catch (error) {
      console.error('AI Chat Error:', error);
      toast.error('Failed to get AI response');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please check your internet connection and try again. Make sure the Gemini API key is properly configured in the backend.',
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      updateCurrentSession(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearCodeContext = () => {
    setCodeContext('');
    setShowCodeInput(false);
  };

  return (
    <div className="h-full bg-black text-white relative flex">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      
      {/* Sidebar */}
      <div className="relative z-10 w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={createNewChat}
            className="w-full btn btn-primary"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                currentSession?.id === session.id
                  ? 'bg-purple-600/20 border border-purple-500/30'
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
              onClick={() => selectChat(session)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(session.id, session.title);
                }}
                className="opacity-0 group-hover:opacity-100 btn btn-destructive btn-icon"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">AI Chat Assistant</h1>
              <p className="text-gray-400">Powered by Gemini 2.5 Flash - Get expert coding help</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl px-4 py-3 rounded-2xl ${
                message.type === 'user' 
                  ? 'bg-indigo-500/20 border border-indigo-400/30 text-white' 
                  : 'bg-gray-800 text-gray-100 border border-white/10'
              }`}>
                {message.codeContext && (
                  <div className="mb-3 p-3 bg-black/30 rounded-lg border border-gray-600">
                    <div className="flex items-center space-x-2 mb-2">
                      <CodeBracketIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-purple-400 font-medium">Code Context</span>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                      {message.codeContext}
                    </pre>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.timestamp && (
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-6 border-t border-gray-800">
          {/* Code Context Input */}
          {showCodeInput && (
            <div className="mb-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CodeBracketIcon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Code Context</span>
                </div>
                <button
                  onClick={clearCodeContext}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={codeContext}
                onChange={(e) => setCodeContext(e.target.value)}
                placeholder="Paste your code here for context..."
                className="w-full h-32 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          )}
          
          <div className="flex space-x-4">
            <div className="flex-1 flex space-x-2">
              <button
                onClick={() => setShowCodeInput(!showCodeInput)}
                className={`btn ${showCodeInput || codeContext ? 'btn-primary' : 'btn-secondary'} ${
                  showCodeInput || codeContext
                    ? ''
                    : ''
                }`}
                title="Add code context"
              >
                <CodeBracketIcon className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about coding..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="btn btn-primary px-4"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          
          {codeContext && (
            <div className="mt-2 text-xs text-purple-400">
              Code context added ({codeContext.length} characters)
            </div>
          )}
        </div>
      </div>
      
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, sessionId: null, sessionName: '' })}
        onConfirm={confirmDelete}
        itemType="chat session"
        itemName={deleteModal.sessionName}
      />
    </div>
  );
};

export default AIChatPage;
