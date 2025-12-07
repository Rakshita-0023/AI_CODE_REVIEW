import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Editor } from '@monaco-editor/react';
import { scratchpadAPI } from '../../services/api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const ScratchpadPanel = () => {
  const { currentProject, theme } = useStore();
  const [scratchpads, setScratchpads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScratchpad, setActiveScratchpad] = useState(null);
  const [scratchpadContent, setScratchpadContent] = useState('');
  const [scratchpadTitle, setScratchpadTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentProject?.id) {
      fetchScratchpads();
    }
  }, [currentProject?.id]);

  const fetchScratchpads = async () => {
    try {
      setLoading(true);
      const response = await scratchpadAPI.getWorkspaceScratchpads(currentProject.id);
      setScratchpads(response.data.scratchpads || []);
    } catch (error) {
      console.error('Failed to fetch scratchpads:', error);
      toast.error('Failed to load scratchpads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScratchpad = async () => {
    const newScratchpad = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '// Start writing your note here...\n',
      createdAt: new Date().toISOString()
    };
    
    setActiveScratchpad(newScratchpad);
    setScratchpadTitle(newScratchpad.title);
    setScratchpadContent(newScratchpad.content);
    setIsEditing(true);
  };

  const handleEditScratchpad = (scratchpad) => {
    setActiveScratchpad(scratchpad);
    setScratchpadTitle(scratchpad.title);
    setScratchpadContent(scratchpad.content);
    setIsEditing(false);
  };

  const handleSaveScratchpad = async () => {
    if (!scratchpadTitle.trim() || !scratchpadContent.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    try {
      const scratchpadData = {
        workspaceId: currentProject.id,
        title: scratchpadTitle,
        content: scratchpadContent
      };

      if (isEditing) {
        const response = await scratchpadAPI.createScratchpad(scratchpadData);
        setScratchpads(prev => [response.data, ...prev]);
        toast.success('Scratchpad created successfully');
      } else {
        const response = await scratchpadAPI.updateScratchpad(activeScratchpad.id, scratchpadData);
        setScratchpads(prev => prev.map(s => s.id === activeScratchpad.id ? response.data : s));
        toast.success('Scratchpad updated successfully');
      }
      
      setActiveScratchpad(null);
      setScratchpadTitle('');
      setScratchpadContent('');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save scratchpad:', error);
      toast.error('Failed to save scratchpad');
    }
  };

  const handleCancelEdit = () => {
    setActiveScratchpad(null);
    setScratchpadTitle('');
    setScratchpadContent('');
    setIsEditing(false);
  };

  const handleDeleteScratchpad = async (id) => {
    if (!confirm('Are you sure you want to delete this scratchpad?')) return;

    try {
      await scratchpadAPI.deleteScratchpad(id);
      setScratchpads(prev => prev.filter(s => s.id !== id));
      toast.success('Scratchpad deleted successfully');
    } catch (error) {
      console.error('Failed to delete scratchpad:', error);
      toast.error('Failed to delete scratchpad');
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notes</h3>
          {!activeScratchpad && (
            <button
              onClick={handleCreateScratchpad}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Note</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeScratchpad ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back to Notes</span>
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveScratchpad}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={scratchpadTitle}
                onChange={(e) => setScratchpadTitle(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Note title..."
              />
            </div>
            
            <div className="flex-1">
              <Editor
                height="100%"
                language="markdown"
                value={scratchpadContent}
                onChange={(value) => setScratchpadContent(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="p-4 h-full overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {scratchpads.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notes yet</p>
                    <p className="text-sm">Create your first note to get started</p>
                  </div>
                ) : (
                  scratchpads.map((scratchpad) => (
                    <div key={scratchpad.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer" onClick={() => handleEditScratchpad(scratchpad)}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white">{scratchpad.title}</h4>
                        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditScratchpad(scratchpad)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteScratchpad(scratchpad.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-3">{scratchpad.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(scratchpad.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScratchpadPanel;