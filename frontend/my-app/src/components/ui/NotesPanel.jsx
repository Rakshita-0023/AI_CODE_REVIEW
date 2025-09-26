import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TagIcon,
  TrashIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  XCircleIcon,
  CodeBracketIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import RichTextEditor from './RichTextEditor';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const NotesPanel = ({ isOpen, onClose }) => {
  const { setCode, setLanguage, setCurrentAnalysis, setIsAnalyzing, user, isAuthenticated } = useStore();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showQuickTags, setShowQuickTags] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showCodeLinker, setShowCodeLinker] = useState(false);
  const [codeToLink, setCodeToLink] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [showLinkedCode, setShowLinkedCode] = useState(false);
  const [showCodeHistory, setShowCodeHistory] = useState(false);
  const [codeHistory, setCodeHistory] = useState([]);
  
  const quickTags = ['Bug Fix', 'Optimization', 'Refactor', 'TODO', 'Review', 'Documentation'];

  // Load code history from localStorage
  useEffect(() => {
    const storageKey = getUserStorageKey('codesense_history');
    const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setCodeHistory(history);
  }, [isAuthenticated, user]);

  // Load notes from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, isAuthenticated, user]);

  const getUserStorageKey = (key) => {
    if (isAuthenticated && user?.id) {
      return `${key}_user_${user.id}`;
    }
    return `${key}_guest`;
  };

  const loadNotes = () => {
    const storageKey = getUserStorageKey('codesense_notes');
    const storedNotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setNotes(storedNotes);
  };

  const saveNotes = (updatedNotes) => {
    const storageKey = getUserStorageKey('codesense_notes');
    localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const createNewNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      isPinned: false,
      linkedCode: null,
      codeBlocks: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setSelectedNote(newNote);
    setIsEditing(true);
    setEditingTitle(newNote.title);
  };

  const updateNote = (noteId, updates) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, lastModified: new Date().toISOString() }
        : note
    );
    saveNotes(updatedNotes);
    
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote({ ...selectedNote, ...updates });
    }
  };

  const deleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      saveNotes(updatedNotes);
      
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(null);
      }
    }
  };

  const togglePin = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    updateNote(noteId, { isPinned: !note.isPinned });
  };

  const addTag = (noteId) => {
    if (newTag.trim()) {
      const note = notes.find(n => n.id === noteId);
      const updatedTags = [...(note.tags || []), newTag.trim()];
      updateNote(noteId, { tags: updatedTags });
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const removeTag = (noteId, tagToRemove) => {
    const note = notes.find(n => n.id === noteId);
    const updatedTags = note.tags.filter(tag => tag !== tagToRemove);
    updateNote(noteId, { tags: updatedTags });
  };

  const handleTitleEdit = () => {
    if (selectedNote) {
      updateNote(selectedNote.id, { title: editingTitle });
      setIsEditing(false);
    }
  };

  const generateAISuggestion = async () => {
    const cleanContent = selectedNote.content.replace(/<[^>]*>/g, '').trim();
    if (!cleanContent) {
      toast.error('Please add some content to get AI suggestions');
      return;
    }

    setIsGeneratingAI(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const suggestions = [
        'Consider organizing your thoughts with bullet points for better readability.',
        'Add specific examples to make your points clearer.',
        'Include actionable next steps at the end of your note.',
        'Break down complex ideas into smaller, digestible sections.',
        'Add relevant tags to help categorize and find this note later.'
      ];
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      setAiSuggestion(randomSuggestion);
      toast.success('AI suggestion generated!');
    } catch (error) {
      toast.error('Failed to generate AI suggestion');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateAISummary = async () => {
    const cleanContent = selectedNote.content.replace(/<[^>]*>/g, '').trim();
    if (!cleanContent) {
      toast.error('Please add some content to summarize');
      return;
    }

    setIsGeneratingAI(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const summary = createIntelligentSummary(cleanContent);
      setAiSummary(summary);
      toast.success('AI summary generated!');
    } catch (error) {
      toast.error('Failed to generate AI summary');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const linkCodeToNote = () => {
    if (selectedNote && codeToLink.trim()) {
      const codeData = {
        code: codeToLink.trim(),
        language: codeLanguage,
        linkedAt: new Date().toISOString()
      };
      updateNote(selectedNote.id, { linkedCode: codeData });
      setCodeToLink('');
      setShowCodeLinker(false);
      toast.success('Code linked to note!');
    }
  };

  const unlinkCode = () => {
    if (selectedNote) {
      updateNote(selectedNote.id, { linkedCode: null });
      setShowLinkedCode(false);
      toast.success('Code unlinked from note!');
    }
  };

  const insertCodeFromHistory = (historyItem) => {
    const code = historyItem.originalCode || historyItem.code || '';
    const language = historyItem.language || 'javascript';
    const codeId = `code_${Date.now()}`;
    const codeBlock = `\n\n--- Code (${language}) [${codeId}] ---\n${code}\n--- End Code ---\n\n`;
    
    const newContent = selectedNote.content + codeBlock;
    const codeBlocks = selectedNote.codeBlocks || [];
    codeBlocks.push({ id: codeId, code, language, linkedAt: new Date().toISOString() });
    
    updateNote(selectedNote.id, { content: newContent, codeBlocks });
    setShowCodeHistory(false);
    toast.success('Code added to note!');
  };

  const handleAIAnalyze = (code, language) => {
    // Set the code and language in the store
    setCode(code);
    setLanguage(language);
    setCurrentAnalysis(null);
    setIsAnalyzing(true);
    
    // Close notes panel
    onClose();
    
    // Show loading message
    toast.success('Loading code for analysis...');
    
    // Simulate analysis after a short delay
    setTimeout(() => {
      const mockAnalysis = {
        type: 'review',
        language: language,
        qualityScore: Math.floor(Math.random() * 30) + 70,
        summary: `Code analysis completed for ${language} code. The code shows good structure with some areas for improvement.`,
        issues: [
          { line: 1, severity: 'medium', message: 'Consider adding error handling' },
          { line: 5, severity: 'low', message: 'Variable naming could be more descriptive' }
        ],
        timestamp: new Date().toISOString()
      };
      setCurrentAnalysis(mockAnalysis);
      setIsAnalyzing(false);
      toast.success('Analysis complete!');
    }, 1500);
  };

  const createIntelligentSummary = (content) => {
    const cleanContent = content.replace(/\[AI-.*?\]/g, '').trim();
    const words = cleanContent.split(' ').filter(w => w.length > 0);
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (words.length < 20) {
      return `Brief summary: This note contains ${words.length} words covering the main topic of "${selectedNote.title}".`;
    }

    // Check if content contains code
    if (cleanContent.includes('function') || cleanContent.includes('def ') || cleanContent.includes('class ') || cleanContent.includes('import ')) {
      return `Technical summary: This note documents code implementation with ${words.length} words. Contains programming concepts, functions, and technical details related to "${selectedNote.title}".`;
    }

    // Extract key themes
    const keyWords = words.filter(word => 
      word.length > 4 && 
      !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'were', 'said', 'when', 'where', 'what', 'which'].includes(word.toLowerCase())
    );
    
    const topKeyWords = keyWords.slice(0, 5).join(', ');
    
    if (sentences.length === 1) {
      return `Summary: This note focuses on ${topKeyWords.toLowerCase()} with detailed information in ${words.length} words.`;
    }
    
    // Multi-sentence summary
    const firstSentence = sentences[0].trim().substring(0, 60);
    return `Summary: ${firstSentence}... This ${words.length}-word note covers key topics including ${topKeyWords.toLowerCase()}.`;
  };

  const acceptAISuggestion = () => {
    const suggestionText = `\n\n━━━ 🤖 AI SUGGESTION ━━━\n${aiSuggestion}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    updateNote(selectedNote.id, { content: selectedNote.content + suggestionText });
    setAiSuggestion(null);
    toast.success('AI suggestion added to note!');
  };

  const acceptAISummary = () => {
    const summaryText = `\n\n━━━ 📝 AI SUMMARY ━━━━\n${aiSummary}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    updateNote(selectedNote.id, { content: selectedNote.content + summaryText });
    setAiSummary(null);
    toast.success('AI summary added to note!');
  };

  const rejectAISuggestion = () => {
    setAiSuggestion(null);
    toast.success('AI suggestion dismissed');
  };

  const rejectAISummary = () => {
    setAiSummary(null);
    toast.success('AI summary dismissed');
  };



  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastModified) - new Date(a.lastModified);
  });



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-4xl bg-[rgba(20,20,30,0.6)] backdrop-blur-xl border-l border-white/10 flex animate-slide-in-right shadow-2xl">
        {/* Notes List */}
        <div className="w-1/3 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                Notes
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Enhanced Search */}
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  type="text"
                  placeholder="Search notes, tags, content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-[#7B3FE4] backdrop-blur-sm"
                />
              </div>
              
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => setSearchTerm('')}
                  className={`px-2 py-1 rounded-full text-xs transition-all ${
                    searchTerm === '' ? 'bg-[#7B3FE4] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setSearchTerm('TODO')}
                  className={`px-2 py-1 rounded-full text-xs transition-all ${
                    searchTerm === 'TODO' ? 'bg-[#7B3FE4] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  TODOs
                </button>
                <button 
                  onClick={() => setSearchTerm('Bug Fix')}
                  className={`px-2 py-1 rounded-full text-xs transition-all ${
                    searchTerm === 'Bug Fix' ? 'bg-[#7B3FE4] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Bugs
                </button>
                <button 
                  onClick={() => {
                    const pinnedNotes = notes.filter(n => n.isPinned);
                    setNotes([...pinnedNotes, ...notes.filter(n => !n.isPinned)]);
                  }}
                  className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/70 hover:bg-white/20 transition-all"
                >
                  ⭐ Pinned
                </button>
              </div>
            </div>
            
            {/* New Note Button */}
            <button
              onClick={createNewNote}
              className="w-full mt-3 bg-gradient-to-r from-[#7B3FE4] to-[#9E6CFF] hover:from-[#6B2FD4] hover:to-[#8E5CEF] text-white py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_0_20px_rgba(123,63,228,0.4)] border border-white/10"
            >
              📝 New Note
            </button>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto">
            {sortedNotes.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <p className="text-sm">Create your first note!</p>
              </div>
            ) : (
              sortedNotes.map((note) => {
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`m-2 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-[#7B3FE4]/50 hover:shadow-[0_0_20px_rgba(123,63,228,0.3)] ${
                      selectedNote?.id === note.id ? 'bg-white/10 border-[#7B3FE4] shadow-[0_0_20px_rgba(123,63,228,0.4)]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {note.isPinned && <StarIcon className="w-4 h-4 text-yellow-400" />}
                          <h3 className="font-semibold text-white truncate text-lg">{note.title}</h3>
                        </div>
                        <p className="text-sm text-white/70 line-clamp-2 mb-3 leading-relaxed">
                          {note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 100) + (note.content.replace(/<[^>]*>/g, '').length > 100 ? '...' : '') : 'No content'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>{new Date(note.lastModified).toLocaleDateString()}</span>
                          <span>{note.content ? `${note.content.replace(/<[^>]*>/g, '').split(' ').filter(w => w.length > 0).length} words` : '0 words'}</span>
                        </div>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {note.tags.slice(0, 3).map((tag, index) => {
                              const tagColors = {
                                'Bug Fix': 'bg-red-500/20 text-red-300 border-red-500/30',
                                'Optimization': 'bg-green-500/20 text-green-300 border-green-500/30',
                                'Refactor': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                'TODO': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              };
                              const colorClass = tagColors[tag] || 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                              return (
                                <span
                                  key={index}
                                  className={`text-xs px-2 py-1 rounded-full border ${colorClass}`}
                                >
                                  {tag}
                                </span>
                              );
                            })}
                            {note.tags.length > 3 && (
                              <span className="text-xs text-white/40">+{note.tags.length - 3}</span>
                            )}
                            {note.linkedCode && (
                              <span className="text-xs px-2 py-1 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1">
                                <CodeBracketIcon className="w-3 h-3" />
                                {note.linkedCode.language}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <>
              {/* Note Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white focus:outline-none focus:border-purple-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleTitleEdit()}
                        autoFocus
                      />
                      <button
                        onClick={handleTitleEdit}
                        className="text-green-400 hover:text-green-300"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditingTitle(selectedNote.title);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                      {selectedNote.title}
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditingTitle(selectedNote.title);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </h1>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCodeLinker(!showCodeLinker)}
                      className="p-2 text-white/60 hover:text-white rounded-lg transition-colors"
                      title="Link Code"
                    >
                      <CodeBracketIcon className="w-4 h-4" />
                    </button>
                    {selectedNote.linkedCode && (
                      <button
                        onClick={() => setShowLinkedCode(!showLinkedCode)}
                        className="p-2 text-blue-400 hover:text-blue-300 rounded-lg transition-colors"
                        title="View Linked Code"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => togglePin(selectedNote.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedNote.isPinned 
                          ? 'text-yellow-500 hover:text-yellow-400' 
                          : 'text-white/60 hover:text-white'
                      }`}
                      title={selectedNote.isPinned ? 'Unpin note' : 'Pin note'}
                    >
                      <StarIcon className={`w-4 h-4 ${selectedNote.isPinned ? 'fill-current' : 'stroke-current fill-none'}`} />
                    </button>
                    <button
                      onClick={() => deleteNote(selectedNote.id)}
                      className="p-2 text-white/60 hover:text-red-400 transition-colors"
                      title="Delete note"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedNote.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(selectedNote.id, tag)}
                        className="text-purple-400 hover:text-red-400"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  
                  {showTagInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Tag name"
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                        onKeyPress={(e) => e.key === 'Enter' && addTag(selectedNote.id)}
                        autoFocus
                      />
                      <button
                        onClick={() => addTag(selectedNote.id)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <CheckIcon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setShowTagInput(false);
                          setNewTag('');
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircleIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setShowQuickTags(!showQuickTags)}
                        className="text-white/60 hover:text-white text-sm flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-[#7B3FE4]/50 transition-all"
                      >
                        <TagIcon className="w-3 h-3" />
                        Add tag
                      </button>
                      {showQuickTags && (
                        <div className="absolute top-8 left-0 bg-[rgba(20,20,30,0.9)] backdrop-blur-xl border border-white/10 rounded-xl p-2 z-10 min-w-48">
                          <div className="grid grid-cols-2 gap-1">
                            {quickTags.map(tag => (
                              <button
                                key={tag}
                                onClick={() => {
                                  const note = notes.find(n => n.id === selectedNote.id);
                                  if (!note.tags.includes(tag)) {
                                    updateNote(selectedNote.id, { tags: [...note.tags, tag] });
                                  }
                                  setShowQuickTags(false);
                                }}
                                className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-[#7B3FE4]/20 text-white/80 hover:text-white transition-all"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              setShowTagInput(true);
                              setShowQuickTags(false);
                            }}
                            className="w-full mt-2 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-[#7B3FE4]/20 text-white/60 hover:text-white transition-all border border-dashed border-white/20"
                          >
                            + Custom tag
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>


              </div>



              {/* AI Suggestion Modal */}
              {aiSuggestion && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="bg-[rgba(20,20,30,0.95)] backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-md mx-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      🤖 AI Enhancement Suggestion
                    </h4>
                    <p className="text-white/80 mb-4 leading-relaxed">{aiSuggestion}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={acceptAISuggestion}
                        className="flex-1 bg-gradient-to-r from-[#7B3FE4] to-[#9E6CFF] text-white py-2 rounded-lg text-sm font-medium"
                      >
                        ✓ Accept & Add
                      </button>
                      <button
                        onClick={rejectAISuggestion}
                        className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm font-medium"
                      >
                        ✗ Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Summary Modal */}
              {aiSummary && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="bg-[rgba(20,20,30,0.95)] backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-md mx-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      📝 AI Summary
                    </h4>
                    <p className="text-white/80 mb-4 leading-relaxed">{aiSummary}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={acceptAISummary}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg text-sm font-medium"
                      >
                        ✓ Accept & Add
                      </button>
                      <button
                        onClick={rejectAISummary}
                        className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm font-medium"
                      >
                        ✗ Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Code History Dialog */}
              {showCodeHistory && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="bg-[rgba(20,20,30,0.95)] backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-semibold flex items-center gap-2">
                        <CodeBracketIcon className="w-5 h-5" />
                        Select Code from History
                      </h4>
                      <button
                        onClick={() => setShowCodeHistory(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {codeHistory.length === 0 ? (
                        <div className="text-center text-white/60 py-8">
                          <CodeBracketIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No code history found</p>
                          <p className="text-sm">Analyze some code first to build your history</p>
                        </div>
                      ) : (
                        codeHistory.slice(0, 10).map((item, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#7B3FE4]/50 transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                  {item.language || 'javascript'}
                                </span>
                                <span className="text-xs text-white/50">
                                  {new Date(item.timestamp || item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <button
                                onClick={() => insertCodeFromHistory(item)}
                                className="text-xs bg-gradient-to-r from-[#7B3FE4] to-[#9E6CFF] text-white px-3 py-1 rounded-full hover:scale-105 transition-all"
                              >
                                Insert
                              </button>
                            </div>
                            <pre className="text-sm text-white/80 font-mono bg-black/20 p-2 rounded overflow-x-auto max-h-32">
                              <code>{(item.originalCode || item.code || '').substring(0, 200)}{(item.originalCode || item.code || '').length > 200 ? '...' : ''}</code>
                            </pre>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Code Linker Dialog */}
              {showCodeLinker && (
                <div className="absolute top-16 right-4 bg-[rgba(20,20,30,0.95)] backdrop-blur-xl border border-white/20 rounded-xl p-4 z-20 min-w-96 max-w-lg">
                  <h4 className="text-white font-semibold mb-3">Link Code to Note</h4>
                  <div className="space-y-3">
                    <select 
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value="javascript" className="bg-gray-800">JavaScript</option>
                      <option value="python" className="bg-gray-800">Python</option>
                      <option value="java" className="bg-gray-800">Java</option>
                      <option value="cpp" className="bg-gray-800">C++</option>
                      <option value="html" className="bg-gray-800">HTML</option>
                      <option value="css" className="bg-gray-800">CSS</option>
                      <option value="sql" className="bg-gray-800">SQL</option>
                    </select>
                    <textarea
                      value={codeToLink}
                      onChange={(e) => setCodeToLink(e.target.value)}
                      placeholder="Paste your code here..."
                      className="w-full h-32 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm font-mono resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={linkCodeToNote}
                        disabled={!codeToLink.trim()}
                        className="flex-1 bg-gradient-to-r from-[#7B3FE4] to-[#9E6CFF] text-white py-2 rounded-lg text-sm disabled:opacity-50"
                      >
                        Link Code
                      </button>
                      <button
                        onClick={() => setShowCodeLinker(false)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Area - Split when code is shown */}
              <div className="flex-1 overflow-hidden flex">
                {/* Note Editor */}
                <div className={`${showLinkedCode && selectedNote.linkedCode ? 'w-1/2 border-r border-white/10' : 'w-full'} overflow-hidden`}>
                  <div className="relative h-full">
                    <RichTextEditor
                      content={selectedNote.content}
                      onChange={(content) => updateNote(selectedNote.id, { content })}
                      placeholder="Start writing your note... Use the toolbar above for rich formatting!"
                      onCodeHistoryOpen={() => setShowCodeHistory(true)}
                    />
                    {/* AI Analyze Buttons for Code Blocks */}
                    {selectedNote.codeBlocks?.map((codeBlock, index) => {
                      const codePattern = new RegExp(`--- Code \\(${codeBlock.language}\\) \\[${codeBlock.id}\\] ---`);
                      const match = selectedNote.content.match(codePattern);
                      if (!match) return null;
                      
                      const matchIndex = selectedNote.content.indexOf(match[0]);
                      const lines = selectedNote.content.substring(0, matchIndex).split('\n').length;
                      const topPosition = (lines - 1) * 20 + 100; // Approximate line height
                      
                      return (
                        <button
                          key={codeBlock.id}
                          onClick={() => handleAIAnalyze(codeBlock.code, codeBlock.language)}
                          className="absolute right-4 bg-gradient-to-r from-[#7B3FE4] to-[#9E6CFF] text-white px-3 py-1 rounded-lg text-xs font-medium hover:scale-105 transition-all shadow-lg z-10"
                          style={{ top: `${Math.max(topPosition, 100)}px` }}
                        >
                          🤖 Analyze
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Linked Code Viewer */}
                {showLinkedCode && selectedNote.linkedCode && (
                  <div className="w-1/2 flex flex-col bg-white/5">
                    <div className="p-3 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CodeBracketIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white font-medium">Linked Code ({selectedNote.linkedCode.language})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedNote.linkedCode.code);
                            toast.success('Code copied to clipboard!');
                          }}
                          className="p-1 text-white/60 hover:text-white text-xs"
                          title="Copy Code"
                        >
                          Copy
                        </button>
                        <button
                          onClick={unlinkCode}
                          className="p-1 text-red-400 hover:text-red-300 text-xs"
                          title="Unlink Code"
                        >
                          Unlink
                        </button>
                        <button
                          onClick={() => setShowLinkedCode(false)}
                          className="p-1 text-white/60 hover:text-white"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 p-3 overflow-auto">
                      <pre className="text-sm text-white/90 font-mono whitespace-pre-wrap break-words">
                        <code>{selectedNote.linkedCode.code}</code>
                      </pre>
                    </div>
                    <div className="p-2 border-t border-white/10 text-xs text-white/50">
                      Linked: {new Date(selectedNote.linkedCode.linkedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              {/* Enhanced Footer with AI Actions */}
              <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span>Words: {selectedNote.content ? selectedNote.content.split(' ').filter(w => w.length > 0).length : 0}</span>
                    <span>Characters: {selectedNote.content ? selectedNote.content.length : 0}</span>
                    {selectedNote.codeBlocks?.length > 0 && (
                      <span>Code Blocks: {selectedNote.codeBlocks.length}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/50">
                    Last modified: {new Date(selectedNote.lastModified).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateAISuggestion}
                    disabled={isGeneratingAI || !selectedNote.content.trim()}
                    className="text-xs bg-gradient-to-r from-[#7B3FE4] to-[#9E6CFF] hover:from-[#6B2FD4] hover:to-[#8E5CEF] text-white px-3 py-1 rounded-full transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {isGeneratingAI ? '⏳' : '🤖'} AI Enhance
                  </button>
                  <button
                    onClick={generateAISummary}
                    disabled={isGeneratingAI || !selectedNote.content.trim()}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-all disabled:opacity-50"
                  >
                    {isGeneratingAI ? '⏳' : '📝'} Summarize
                  </button>
                  <button
                    onClick={() => {
                      const markdown = selectedNote.content.replace(/<[^>]*>/g, '');
                      const blob = new Blob([`# ${selectedNote.title}\n\n${markdown}`], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedNote.title}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-all"
                  >
                    📄 Export
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a note to edit</p>
                <p className="text-sm">or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;