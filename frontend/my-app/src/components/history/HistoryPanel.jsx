import { useState, useEffect } from 'react';
import { ClockIcon, CodeBracketIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';
import { historyAPI } from '../../services/api';
import styles from './HistoryPanel.module.css';

const HistoryPanel = ({ isOpen, onClose }) => {
  const { isAuthenticated, analysisHistory, user } = useStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, isAuthenticated, user]);

  const getUserStorageKey = (key) => {
    if (isAuthenticated && user?.id) {
      return `${key}_user_${user.id}`;
    }
    return `${key}_guest`;
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Load from user-specific localStorage
      const storageKey = getUserStorageKey('codesense_history');
      const localHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Transform data to match expected format
      const formattedHistory = localHistory.map((item, index) => ({
        id: item.id || `local-${index}`,
        type: item.type || 'review',
        language: item.language || 'javascript',
        codePreview: item.originalCode ? item.originalCode.substring(0, 50) + '...' : 'No code',
        createdAt: item.timestamp || new Date().toISOString(),
        qualityScore: item.qualityScore || null,
        originalCode: item.originalCode || '',
        result: item
      }));
      
      setHistory(formattedHistory);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id) => {
    try {
      await historyAPI.deleteAnalysis(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete analysis:', error);
    }
  };

  const viewAnalysis = async (id) => {
    try {
      // Find analysis in current history
      const analysis = history.find(item => item.id === id);
      if (analysis) {
        setSelectedAnalysis({
          ...analysis,
          result: analysis.result || analysis
        });
        return;
      }
      
      // Try API as fallback
      const response = await historyAPI.getAnalysis(id);
      setSelectedAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      review: 'bg-blue-100 text-blue-800',
      debug: 'bg-red-100 text-red-800',
      approaches: 'bg-yellow-100 text-yellow-800',
      optimize: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      review: '🔍',
      debug: '🐛',
      approaches: '💡',
      optimize: '🚀',
    };
    return icons[type] || '📄';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <ClockIcon className="w-5 h-5" />
            <span>Analysis History</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* History List */}
          <div className="w-1/2 border-r overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">Loading...</div>
            ) : history.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No analysis history found. Start analyzing code to build your history!
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group border rounded-lg p-3 hover:bg-[#7B3FE4]/10 hover:border-[#7B3FE4]/30 cursor-pointer border-white/10 transition-all"
                    onClick={() => viewAnalysis(item.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getTypeIcon(item.type)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <span className="text-xs bg-white/10 dark:bg-white/10 px-2 py-1 rounded text-white/80">
                          {item.language}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewAnalysis(item.id);
                          }}
                          className="p-1 hover:bg-white/10 dark:hover:bg-white/10 rounded text-white/60 hover:text-white"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnalysis(item.id);
                          }}
                          className="p-1 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <code className="bg-black/20 group-hover:bg-black/30 px-2 py-1 rounded text-xs text-white/90 transition-all">
                        {item.codePreview}
                      </code>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.qualityScore && (
                        <span className="font-medium">Score: {item.qualityScore}/100</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Details */}
          <div className="w-1/2 overflow-y-auto">
            {selectedAnalysis ? (
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getTypeIcon(selectedAnalysis.type)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedAnalysis.type)}`}>
                      {selectedAnalysis.type}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                      {selectedAnalysis.language}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedAnalysis.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Original Code:</h4>
                    <pre className="bg-white/10 dark:bg-white/10 p-3 rounded text-sm overflow-auto max-h-32 text-white/90">
                      {selectedAnalysis.originalCode}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Analysis Result:</h4>
                    <div className="bg-white/5 dark:bg-white/5 p-3 rounded text-sm text-white/90">
                      {selectedAnalysis.result.summary && (
                        <p className="mb-2"><strong>Summary:</strong> {selectedAnalysis.result.summary}</p>
                      )}
                      {selectedAnalysis.result.qualityScore && (
                        <p className="mb-2"><strong>Quality Score:</strong> {selectedAnalysis.result.qualityScore}/100</p>
                      )}
                      {selectedAnalysis.result.issues && selectedAnalysis.result.issues.length > 0 && (
                        <div className="mb-2">
                          <strong>Issues Found:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {selectedAnalysis.result.issues.map((issue, idx) => (
                              <li key={idx} className="text-xs">
                                Line {issue.line}: {issue.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <CodeBracketIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select an analysis to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;