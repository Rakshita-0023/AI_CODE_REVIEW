import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ClipboardDocumentIcon, 
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import LottieAnimation from './LottieAnimation';
import styles from './ResultsPanel.module.css';

const ResultsPanel = ({ onShowHistory, onShowNotes }) => {
  const { currentAnalysis, theme, isAnalyzing } = useStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Reset to overview tab when analysis starts
  useEffect(() => {
    if (isAnalyzing) {
      setActiveTab('overview');
    }
  }, [isAnalyzing]);



  const renderHeader = () => (
    <div className={styles.header}>
      <h3 className={styles.title}>
        Analysis Results
      </h3>
      <div className={styles.actions}>
        <button
          onClick={onShowHistory}
          className={styles.actionButton}
          title="History"
        >
          <ClockIcon className={styles.actionIcon} />
        </button>
        <button
          onClick={onShowNotes}
          className={styles.actionButton}
          title="Notes"
        >
          <DocumentTextIcon className={styles.actionIcon} />
        </button>
        {currentAnalysis && (
          <>
            <button
              onClick={() => copyToClipboard(JSON.stringify(currentAnalysis, null, 2))}
              className={styles.actionButton}
              title="Copy results"
            >
              <ClipboardDocumentIcon className={styles.actionIcon} />
            </button>
            <button
              onClick={downloadResults}
              className={styles.actionButton}
              title="Download results"
            >
              <ArrowDownTrayIcon className={styles.actionIcon} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col">
        {renderHeader()}
        <div className="flex-1 flex items-center justify-center transition-opacity duration-500 ease-in-out">
          <div className="w-64 h-64">
            <LottieAnimation />
          </div>
        </div>
      </div>
    );
  }

  if (!currentAnalysis) {
    return (
      <div className="h-full flex flex-col">
        {renderHeader()}
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-opacity duration-500 ease-in-out">
          <div className="text-center">
            <DocumentMagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No analysis results yet</p>
            <p className="text-sm">Run an analysis to see results here</p>
          </div>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadResults = () => {
    const content = JSON.stringify(currentAnalysis, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'issues', label: 'Issues' },
    { id: 'fixes', label: 'Fixes' },
    { id: 'alternatives', label: 'Alternatives' },
    { id: 'optimizations', label: 'Optimizations' },
  ];

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}

      {/* Tabs */}
      <div className="flex border-b border-white/10 relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-300 ease-out relative z-10 ${
              activeTab === tab.id
                ? 'border-[#7B3FE4] text-[#9E6CFF] bg-white/5 rounded-t-xl'
                : 'border-transparent text-white/60 hover:text-white/80 hover:bg-white/5 rounded-t-xl'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="p-6 space-y-6 max-w-full break-words">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Navigation */}
            <div className="card p-4">
              <h4 className="font-semibold mb-2">Quick Navigation</h4>
              <div className="flex flex-wrap gap-2">
                {currentAnalysis.issues?.length > 0 && (
                  <button
                    onClick={() => setActiveTab('issues')}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    {currentAnalysis.issues.length} Issues Found
                  </button>
                )}
                {currentAnalysis.fixedCode && (
                  <button
                    onClick={() => setActiveTab('fixes')}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    View Fixes
                  </button>
                )}
                {currentAnalysis.alternatives?.length > 0 && (
                  <button
                    onClick={() => setActiveTab('alternatives')}
                    className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                  >
                    {currentAnalysis.alternatives.length} Alternatives
                  </button>
                )}
                {currentAnalysis.optimizations?.length > 0 && (
                  <button
                    onClick={() => setActiveTab('optimizations')}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    {currentAnalysis.optimizations.length} Optimizations
                  </button>
                )}
              </div>
            </div>

            {currentAnalysis.qualityScore && (
              <div className="card p-4">
                <h4 className="font-semibold mb-2">Code Quality Score</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${currentAnalysis.qualityScore}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-primary-600">
                    {currentAnalysis.qualityScore}/100
                  </span>
                </div>
              </div>
            )}

            <div className="card p-4">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-3 bg-gray-50 dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <p className="text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap text-sm leading-relaxed">
                  {currentAnalysis.summary || currentAnalysis.explanation || `${currentAnalysis.type.charAt(0).toUpperCase() + currentAnalysis.type.slice(1)} analysis completed successfully. Check the relevant tabs for detailed results.`}
                </p>
              </div>
            </div>

            <div className="card p-4">
              <h4 className="font-semibold mb-2">Analysis Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="break-words">
                  <span className="text-gray-500">Language:</span>
                  <span className="ml-2 font-medium">{currentAnalysis.language}</span>
                </div>
                <div className="break-words">
                  <span className="text-gray-500">Processing Time:</span>
                  <span className="ml-2 font-medium">{currentAnalysis.processingTime || 'N/A'}ms</span>
                </div>
                <div className="break-words">
                  <span className="text-gray-500">Analysis Type:</span>
                  <span className="ml-2 font-medium capitalize">{currentAnalysis.type}</span>
                </div>
                <div className="break-words">
                  <span className="text-gray-500">Timestamp:</span>
                  <span className="ml-2 font-medium">
                    {new Date(currentAnalysis.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-4">
            {currentAnalysis?.issues?.length > 0 ? (
              currentAnalysis.issues.map((issue, index) => (
                <div key={index} className="card p-4">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">Line {issue.line}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2 break-words">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded break-words">
                          <strong>Suggestion:</strong> {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No issues found in this analysis
              </div>
            )}
          </div>
        )}

        {activeTab === 'fixes' && (
          <div className="space-y-4">
            {currentAnalysis?.fixedCode ? (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Fixed Code</h4>
                  <button
                    onClick={() => copyToClipboard(currentAnalysis.fixedCode)}
                    className="btn-secondary text-sm"
                  >
                    Copy Code
                  </button>
                </div>
                <SyntaxHighlighter
                  language={currentAnalysis.language || 'javascript'}
                  style={theme === 'dark' ? oneDark : oneLight}
                  className="rounded-lg text-sm"
                  wrapLines={true}
                  wrapLongLines={true}
                  customStyle={{
                    maxWidth: '100%',
                    overflow: 'auto',
                    wordBreak: 'break-word'
                  }}
                >
                  {currentAnalysis.fixedCode}
                </SyntaxHighlighter>
                {(currentAnalysis.explanation || currentAnalysis.summary) && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <strong className="text-blue-700 dark:text-blue-300">Explanation:</strong>
                    <p className="text-blue-600 dark:text-blue-400 text-sm mt-1 break-words">
                      {currentAnalysis.explanation || currentAnalysis.summary}
                    </p>
                  </div>
                )}
              </div>
            ) : currentAnalysis?.type === 'debug' ? (
              <div className="card p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">Debug Analysis Complete</p>
                  <p className="text-sm">Check the Issues tab for identified problems, or the Overview tab for summary.</p>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No fixes needed</p>
                  <p className="text-sm">The analysis didn't identify any issues that require code fixes.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div className="space-y-4">
            {currentAnalysis?.alternatives?.length > 0 ? (
              currentAnalysis.alternatives.map((alt, index) => (
                <div key={index} className="card p-4">
                  <h4 className="font-semibold mb-2">{alt.approach || 'Alternative Approach'}</h4>
                  {alt.code && (
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Implementation:</h5>
                      <SyntaxHighlighter
                        language={currentAnalysis.language}
                        style={theme === 'dark' ? oneDark : oneLight}
                        className="rounded-lg text-sm"
                        wrapLines={true}
                        wrapLongLines={true}
                        customStyle={{
                          maxWidth: '100%',
                          overflow: 'auto',
                          wordBreak: 'break-word'
                        }}
                      >
                        {alt.code}
                      </SyntaxHighlighter>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {alt.pros && (
                      <div>
                        <strong className="text-green-600 dark:text-green-400">Pros:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {alt.pros.map((pro, i) => (
                            <li key={i} className="text-sm break-words">{pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {alt.cons && (
                      <div>
                        <strong className="text-red-600 dark:text-red-400">Cons:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {alt.cons.map((con, i) => (
                            <li key={i} className="text-sm break-words">{con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No alternative approaches found</p>
                  <p className="text-sm">The analysis didn't identify alternative implementation approaches for this code.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimizations' && (
          <div className="space-y-4">
            {currentAnalysis?.optimizations?.length > 0 ? (
              currentAnalysis.optimizations.map((opt, index) => (
                <div key={index} className="card p-4">
                  <h4 className="font-semibold mb-2">{opt.type || 'Performance Optimization'}</h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 break-words">{opt.description || 'Optimization suggestion provided'}</p>
                  {opt.optimizedCode && (
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Optimized Code:</h5>
                      <SyntaxHighlighter
                        language={currentAnalysis.language}
                        style={theme === 'dark' ? oneDark : oneLight}
                        className="rounded-lg text-sm"
                        wrapLines={true}
                        wrapLongLines={true}
                        customStyle={{
                          maxWidth: '100%',
                          overflow: 'auto',
                          wordBreak: 'break-word'
                        }}
                      >
                        {opt.optimizedCode}
                      </SyntaxHighlighter>
                    </div>
                  )}
                  {opt.improvement && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <strong className="text-green-700 dark:text-green-300">Improvement:</strong>
                      <p className="text-green-600 dark:text-green-400 text-sm mt-1 break-words">{opt.improvement}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="card p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No optimizations found</p>
                  <p className="text-sm">The analysis didn't identify any performance optimizations for this code.</p>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;