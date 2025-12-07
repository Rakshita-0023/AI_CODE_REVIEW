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

const ResultsPanel = () => {
  const { currentAnalysis, theme, isAnalyzing } = useStore();

  const renderHeader = () => (
    <div className="p-4 border-b border-gray-800">
      <h3 className="text-lg font-semibold text-white">
        Analysis Results
      </h3>
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
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-opacity duration-500 ease-in-out p-6">
          <div className="text-center max-w-md">
            <DocumentMagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
            <p className="text-sm mb-6">
              Enter your code in the editor and use the toolbar above to:
            </p>
            <ul className="text-left text-sm space-y-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Review code quality and best practices
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Debug errors and find logical bugs
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Optimize performance and efficiency
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Explore alternative implementation approaches
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }



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

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="p-6 space-y-6 max-w-full break-words">
          <div className="space-y-6">
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
                  {currentAnalysis.summary || currentAnalysis.explanation || `${currentAnalysis.type.charAt(0).toUpperCase() + currentAnalysis.type.slice(1)} analysis completed successfully.`}
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

          {currentAnalysis?.issues?.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Issues Found</h4>
              {currentAnalysis.issues.map((issue, index) => (
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
              ))}
            </div>
          )}

          {currentAnalysis?.fixedCode && (
            <div className="space-y-4">
              <div className="card p-4">
                <h4 className="font-semibold text-lg mb-4">Fixed Code</h4>
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
            </div>
          )}

          {currentAnalysis?.alternatives?.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Alternative Approaches</h4>
              {currentAnalysis.alternatives.map((alt, index) => (
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
              ))}
            </div>
          )}

          {currentAnalysis?.optimizations?.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Performance Optimizations</h4>
              {currentAnalysis.optimizations.map((opt, index) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;