import { useState } from 'react';
import {
  DocumentMagnifyingGlassIcon,
  BugAntIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { aiAPI } from '../../services/api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import styles from './ActionButtons.module.css';

const ActionButtons = () => {
  const {
    code,
    language,
    setCurrentAnalysis,
    addToHistory,
    isAnalyzing,
    setIsAnalyzing
  } = useStore();

  const handleAnalysis = async (type) => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }

    // Clear previous analysis first
    setCurrentAnalysis(null);
    setIsAnalyzing(true);
    console.log(`Starting ${type} analysis with:`, { code, language });

    try {
      let response;
      const payload = { code, language };

      console.log(`Making API call for ${type}...`);
      switch (type) {
        case 'review':
          response = await aiAPI.reviewCode(payload);
          break;
        case 'debug':
          response = await aiAPI.debugCode(payload);
          break;
        case 'approaches':
          response = await aiAPI.getApproaches(payload);
          break;
        case 'optimize':
          response = await aiAPI.optimizeCode(payload);
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      console.log(`${type} API response:`, response);
      console.log('Response data:', response.data);

      const analysis = {
        ...response.data,
        type,
        timestamp: new Date().toISOString(),
        originalCode: code,
      };

      console.log('Setting analysis:', analysis);
      setCurrentAnalysis(analysis);
      addToHistory(analysis);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} completed!`);
      
      // Force a small delay to ensure state is updated
      setTimeout(() => {
        console.log('Current analysis after setting:', useStore.getState().currentAnalysis);
      }, 100);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(`${type.charAt(0).toUpperCase() + type.slice(1)} failed. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };



  const buttons = [
    {
      id: 'review',
      label: 'Review Code',
      icon: DocumentMagnifyingGlassIcon,
      description: 'Get comprehensive code quality review',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 dark:from-[#7B3FE4] dark:to-[#9E6CFF] hover:from-purple-600 hover:to-purple-700 dark:hover:from-[#6B2FD4] dark:hover:to-[#8E5CEF] hover:shadow-[0_0_20px_rgba(123,63,228,0.4)]',
    },
    {
      id: 'debug',
      label: 'Debug & Fix',
      icon: BugAntIcon,
      description: 'Detect bugs and get fixes',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 dark:from-[#7B3FE4] dark:to-[#9E6CFF] hover:from-purple-600 hover:to-purple-700 dark:hover:from-[#6B2FD4] dark:hover:to-[#8E5CEF] hover:shadow-[0_0_20px_rgba(123,63,228,0.4)]',
    },
    {
      id: 'approaches',
      label: 'Different Approaches',
      icon: LightBulbIcon,
      description: 'Explore alternative solutions',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 dark:from-[#7B3FE4] dark:to-[#9E6CFF] hover:from-purple-600 hover:to-purple-700 dark:hover:from-[#6B2FD4] dark:hover:to-[#8E5CEF] hover:shadow-[0_0_20px_rgba(123,63,228,0.4)]',
    },
    {
      id: 'optimize',
      label: 'Optimize Performance',
      icon: RocketLaunchIcon,
      description: 'Get performance improvements',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 dark:from-[#7B3FE4] dark:to-[#9E6CFF] hover:from-purple-600 hover:to-purple-700 dark:hover:from-[#6B2FD4] dark:hover:to-[#8E5CEF] hover:shadow-[0_0_20px_rgba(123,63,228,0.4)]',
    },
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        AI Analysis
      </h3>

      <div className={styles.buttonGrid}>
        {buttons.map((button) => {
          const Icon = button.icon;
          return (
            <button
              key={button.id}
              onClick={() => handleAnalysis(button.id)}
              disabled={isAnalyzing}
              className={styles.actionButton}
            >
              <Icon className={styles.buttonIcon} />
              <span className={styles.buttonText}>{button.label}</span>
              {isAnalyzing && (
                <div className={styles.loadingDots}>
                  <div className={styles.loadingDot}></div>
                  <div className={styles.loadingDot}></div>
                  <div className={styles.loadingDot}></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!code.trim() && (
        <div className={styles.emptyState}>
          {/* Empty state hidden in toolbar mode via CSS, but keeping structure if needed later */}
        </div>
      )}
    </div>
  );
};

export default ActionButtons;