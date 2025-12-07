import { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  FolderIcon,
  TagIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  CodeBracketIcon,
  LinkIcon,
  ChatBubbleOvalLeftIcon
} from '@heroicons/react/24/solid';
import { notesAPI } from '../services/api';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { moveToTrash } from '../utils/trashUtils';
import toast from 'react-hot-toast';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [folders, setFolders] = useState(['All', 'General', 'Code', 'Ideas']);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState('updatedAt');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, noteId: null, noteName: '' });
  const editorRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, [pagination.page, searchTerm, selectedFolder, sortBy]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchNotes();
      }
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedFolder, sortBy]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedNote && isEditing) {
          saveNote();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNote, isEditing]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getNotes({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        folder: selectedFolder,
        sortBy
      });
      
      setNotes(response.data.notes || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1
      }));
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
    try {
      const newNote = {
        title: 'Untitled Note',
        content: '',
        folder: selectedFolder === 'All' ? 'General' : selectedFolder,
        tags: []
      };
      
      const response = await notesAPI.createNote(newNote);
      const createdNote = response.data;
      
      setNotes([createdNote, ...notes]);
      setSelectedNote(createdNote);
      setIsEditing(true);
      
      setTimeout(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
      }, 100);
      
      toast.success('New note created');
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note');
    }
  };

  const saveNote = async () => {
    if (!selectedNote) return;

    try {
      const updatedNote = {
        ...selectedNote,
        title: titleRef.current?.textContent || selectedNote.title,
        content: editorRef.current?.innerHTML || selectedNote.content,
        updatedAt: new Date().toISOString()
      };

      await notesAPI.updateNote(selectedNote.id, updatedNote);
      
      setNotes(notes.map(note => 
        note.id === selectedNote.id ? updatedNote : note
      ));
      setSelectedNote(updatedNote);
      setIsEditing(false);
      
      toast.success('Note saved');
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    }
  };

  const handleDeleteClick = (noteId, noteName) => {
    setDeleteModal({ isOpen: true, noteId, noteName });
  };

  const confirmDelete = async () => {
    const { noteId } = deleteModal;
    try {
      const noteToDelete = notes.find(note => note.id === noteId);
      if (noteToDelete) {
        moveToTrash(noteToDelete, 'note');
        await notesAPI.deleteNote(noteId);
        setNotes(notes.filter(note => note.id !== noteId));
        
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
        
        toast.success('Note moved to trash');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    } finally {
      setDeleteModal({ isOpen: false, noteId: null, noteName: '' });
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertCodeBlock = () => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const codeBlock = document.createElement('pre');
    codeBlock.className = 'bg-gray-800 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto my-4';
    codeBlock.innerHTML = '<code>// Your code here</code>';
    
    range.insertNode(codeBlock);
    range.setStartAfter(codeBlock);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'All' || note.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const toolbarButtons = [
    { icon: BoldIcon, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: ItalicIcon, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: UnderlineIcon, command: 'underline', title: 'Underline (Ctrl+U)' },
    { icon: ListBulletIcon, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: NumberedListIcon, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: LinkIcon, command: 'createLink', title: 'Insert Link', prompt: true },
    { icon: ChatBubbleOvalLeftIcon, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
    { icon: CodeBracketIcon, action: insertCodeBlock, title: 'Code Block' }
  ];

  return (
    <div className="h-full bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Notes</h1>
            <button
              onClick={createNewNote}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 p-2 rounded-lg transition-all"
              title="New Note"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-purple-500"
            />
          </div>
          
          {/* Folders */}
          <div className="flex flex-wrap gap-2">
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedFolder === folder
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {folder}
              </button>
            ))}
          </div>
        </div>
        
        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="p-4 space-y-2">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note);
                    setIsEditing(false);
                  }}
                  className={`group p-4 rounded-lg cursor-pointer transition-all ${
                    selectedNote?.id === note.id
                      ? 'bg-purple-600/20 border border-purple-500/30'
                      : 'bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate mb-1">{note.title}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-gray-500">{note.folder}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(note.id, note.title);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notes found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    ref={titleRef}
                    defaultValue={selectedNote.title}
                    className="text-xl font-bold bg-transparent border-none outline-none w-full"
                    placeholder="Note title..."
                  />
                ) : (
                  <h2 className="text-xl font-bold">{selectedNote.title}</h2>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveNote}
                      className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-all"
                      title="Save (Ctrl+S)"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 p-2 rounded-lg transition-all"
                      title="Cancel"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg transition-all"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Toolbar */}
            {isEditing && (
              <div className="p-4 border-b border-gray-800 flex items-center space-x-2">
                {toolbarButtons.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (button.action) {
                        button.action();
                      } else if (button.prompt) {
                        const url = prompt('Enter URL:');
                        if (url) formatText(button.command, url);
                      } else {
                        formatText(button.command, button.value);
                      }
                    }}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all"
                    title={button.title}
                  >
                    <button.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Editor Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {isEditing ? (
                <div
                  ref={editorRef}
                  contentEditable
                  dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                  className="min-h-full outline-none prose prose-invert max-w-none"
                  style={{
                    lineHeight: '1.6',
                    fontSize: '16px'
                  }}
                />
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                  className="prose prose-invert max-w-none"
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Select a note to view</h3>
              <p>Choose a note from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
      
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, noteId: null, noteName: '' })}
        onConfirm={confirmDelete}
        itemType="note"
        itemName={deleteModal.noteName}
      />
    </div>
  );
};

export default NotesPage;