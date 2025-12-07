import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  CodeBracketIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { scratchpadAPI } from '../services/api';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import Pagination from '../components/ui/Pagination';
import { moveToTrash } from '../utils/trashUtils';
import toast from 'react-hot-toast';

const ScratchpadPage = () => {
  const [scratchpads, setScratchpads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, scratchpadId: null, scratchpadName: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    fetchScratchpads();
  }, [pagination.page, searchQuery, sortBy]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchScratchpads();
      }
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [searchQuery, sortBy]);

  const fetchScratchpads = async () => {
    try {
      setLoading(true);
      const response = await scratchpadAPI.getScratchpads({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        sortBy
      });
      
      setScratchpads(response.data.scratchpads || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1
      }));
    } catch (error) {
      console.error('Failed to fetch scratchpads:', error);
      toast.error('Failed to load scratchpads');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (scratchpadId, scratchpadName) => {
    setDeleteModal({ isOpen: true, scratchpadId, scratchpadName });
  };

  const confirmDelete = async () => {
    const { scratchpadId } = deleteModal;
    try {
      const scratchpadToDelete = scratchpads.find(s => s.id === scratchpadId);
      if (scratchpadToDelete) {
        moveToTrash(scratchpadToDelete, 'scratchpad');
        await scratchpadAPI.deleteScratchpad(scratchpadId);
        setScratchpads(scratchpads.filter(s => s.id !== scratchpadId));
        toast.success('Scratchpad moved to trash');
      }
    } catch (error) {
      console.error('Failed to delete scratchpad:', error);
      toast.error('Failed to delete scratchpad');
    } finally {
      setDeleteModal({ isOpen: false, scratchpadId: null, scratchpadName: '' });
    }
  };



  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Scratchpads</h1>
            <p className="text-gray-400">All scratchpads created within workspaces</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search scratchpads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Scratchpads Grid */}
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
        ) : scratchpads.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Scratchpads Found</h3>
            <p className="text-gray-500">Create scratchpads within workspaces to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scratchpads.map((scratchpad) => (
              <div
                key={scratchpad.id}
                className="group bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg border bg-green-500/20 text-green-400 border-green-500/30">
                    <DocumentTextIcon className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleDeleteClick(scratchpad.id, scratchpad.title)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-semibold text-lg mb-2">{scratchpad.title}</h3>
                
                <div className="mb-4">
                  <p className="text-gray-400 text-sm line-clamp-3">
                    {scratchpad.content.length > 150 
                      ? scratchpad.content.substring(0, 150) + '...' 
                      : scratchpad.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <CodeBracketIcon className="w-4 h-4" />
                    <span>Workspace #{scratchpad.workspaceId}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(scratchpad.createdAt).toLocaleDateString()}</span>
                  </div>
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
        
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, scratchpadId: null, scratchpadName: '' })}
          onConfirm={confirmDelete}
          itemType="scratchpad"
          itemName={deleteModal.scratchpadName}
        />
      </div>
    </div>
  );
};

export default ScratchpadPage;