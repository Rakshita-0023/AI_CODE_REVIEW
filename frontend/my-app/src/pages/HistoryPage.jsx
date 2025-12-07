import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CodeBracketIcon, 
  BugAntIcon, 
  LightBulbIcon, 
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { historyAPI } from '../services/api';
import Pagination from '../components/ui/Pagination';
import toast from 'react-hot-toast';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, searchQuery, filterType]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await historyAPI.getHistory({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        type: filterType !== 'all' ? filterType : undefined
      });
      setHistory(response.data.history || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1
      }));
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'review': return <CodeBracketIcon className="w-5 h-5" />;
      case 'debug': return <BugAntIcon className="w-5 h-5" />;
      case 'approaches': return <LightBulbIcon className="w-5 h-5" />;
      case 'optimize': return <RocketLaunchIcon className="w-5 h-5" />;
      case 'chat': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'review': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'debug': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'approaches': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'optimize': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'chat': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };



  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Task History</h1>
          <p className="text-gray-400">View all your completed AI tasks and interactions</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Tasks</option>
              <option value="review">Code Review</option>
              <option value="debug">Debug</option>
              <option value="approaches">Approaches</option>
              <option value="optimize">Optimize</option>
              <option value="chat">AI Chat</option>
            </select>
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-3 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No History Found</h3>
            <p className="text-gray-500">Start using AI features to see your task history here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg border ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </div>

                {item.language && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg">
                      {item.language}
                    </span>
                  </div>
                )}

                {item.code && (
                  <div className="mb-4">
                    <div className="bg-gray-800 rounded-lg p-4 max-h-32 overflow-y-auto">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        {item.code.length > 200 ? item.code.substring(0, 200) + '...' : item.code}
                      </pre>
                    </div>
                  </div>
                )}

                {item.result && (
                  <div className="text-sm text-gray-400">
                    {item.type === 'chat' ? (
                      <div>
                        <p><strong>Message:</strong> {item.result.message}</p>
                        <p><strong>Response:</strong> {item.result.response}</p>
                      </div>
                    ) : item.result.summary ? (
                      <p>{item.result.summary}</p>
                    ) : item.result.explanation ? (
                      <p>{item.result.explanation}</p>
                    ) : (
                      <p>Task completed successfully</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>
    </div>
  );
};

export default HistoryPage;