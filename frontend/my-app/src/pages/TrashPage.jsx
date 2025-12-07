import { useState, useEffect } from 'react';
import { 
  TrashIcon, 
  ArrowPathIcon, 
  XMarkIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { trashAPI } from '../services/api';
import Pagination from '../components/ui/Pagination';
import toast from 'react-hot-toast';

const TrashPage = () => {
  const [trashedItems, setTrashedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState('deletedAt');

  useEffect(() => {
    fetchTrashedItems();
  }, [pagination.page, searchQuery, activeTab, sortBy]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchTrashedItems();
      }
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [searchQuery, activeTab, sortBy]);

  const fetchTrashedItems = async () => {
    try {
      setLoading(true);
      const response = await trashAPI.getTrash({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        type: activeTab === 'all' ? '' : activeTab,
        sortBy
      });
      
      setTrashedItems(response.data.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1
      }));
    } catch (error) {
      console.error('Failed to fetch trash:', error);
      const trash = JSON.parse(localStorage.getItem('trashedItems') || '[]');
      setTrashedItems(trash);
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = (itemId) => {
    const updatedTrash = trashedItems.filter(item => item.id !== itemId);
    setTrashedItems(updatedTrash);
    localStorage.setItem('trashedItems', JSON.stringify(updatedTrash));
    toast.success('Item restored successfully');
  };

  const permanentlyDelete = (itemId) => {
    const updatedTrash = trashedItems.filter(item => item.id !== itemId);
    setTrashedItems(updatedTrash);
    localStorage.setItem('trashedItems', JSON.stringify(updatedTrash));
    toast.success('Item permanently deleted');
  };

  const emptyTrash = () => {
    setTrashedItems([]);
    localStorage.setItem('trashedItems', JSON.stringify([]));
    toast.success('Trash emptied');
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'project':
      case 'workspace':
        return <CodeBracketIcon className="w-5 h-5 text-blue-400" />;
      case 'note':
        return <DocumentTextIcon className="w-5 h-5 text-yellow-400" />;
      case 'chat':
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-400" />;
      case 'history':
        return <ClockIcon className="w-5 h-5 text-purple-400" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: trashedItems.length },
    { id: 'workspace', label: 'Workspaces', count: trashedItems.filter(item => item.type === 'workspace').length },
    { id: 'note', label: 'Notes', count: trashedItems.filter(item => item.type === 'note').length },
    { id: 'chat', label: 'Chats', count: trashedItems.filter(item => item.type === 'chat').length },
    { id: 'scratchpad', label: 'Scratchpads', count: trashedItems.filter(item => item.type === 'scratchpad').length },
    { id: 'history', label: 'History', count: trashedItems.filter(item => item.type === 'history').length }
  ];

  const filteredItems = trashedItems.filter(item => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const matchesSearch = !searchQuery || 
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="h-full bg-black text-white overflow-auto">
      <div className="max-w-6xl mx-auto p-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trash</h1>
            <p className="text-gray-400">
              {trashedItems.length} item{trashedItems.length !== 1 ? 's' : ''} in trash
            </p>
          </div>
          
          {trashedItems.length > 0 && (
            <button
              onClick={emptyTrash}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Empty Trash</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-3 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : trashedItems.length === 0 ? (
          <div className="text-center py-16">
            <TrashIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Trash is empty</h3>
            <p className="text-gray-400">Deleted items will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getItemIcon(item.type)}
                    <span className="text-sm text-gray-400 capitalize">{item.type}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.deletedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="font-semibold mb-2 truncate">{item.title || item.name}</h3>
                
                {item.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => restoreItem(item.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center space-x-1"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => permanentlyDelete(item.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center space-x-1"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
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

export default TrashPage;