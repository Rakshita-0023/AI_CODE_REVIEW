import { useState, useEffect } from 'react';
import { PlayIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';
import { executeAPI } from '../../services/api';
import LoadingAnimation from './LoadingAnimation';
import styles from './CodeRunner.module.css';

const CodeRunner = () => {
  const { code, language } = useStore();
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [sampleInput, setSampleInput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Listen for runCode event from header button
  useEffect(() => {
    const handleRunCode = () => {
      if (!isRunning && code.trim()) {
        runCode();
      }
    };

    document.addEventListener('runCode', handleRunCode);
    return () => document.removeEventListener('runCode', handleRunCode);
  }, [code, language, isRunning]);

  // Auto-suggest input/output based on code
  useEffect(() => {
    if (code.trim()) {
      fetchSuggestions();
    } else {
      setSampleInput('');
      setExpectedOutput('');
    }
  }, [code, language]);

  const fetchSuggestions = async () => {
    // Only fetch suggestions if fields are empty to avoid overwriting user input
    if (sampleInput.trim() || expectedOutput.trim()) {
      return;
    }

    try {
      const response = await executeAPI.getSuggestions(code, language);
      if (response.data.suggestions) {
        setSampleInput(response.data.suggestions.input || '');
        setExpectedOutput(response.data.suggestions.output || '');
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      // Fail silently, don't set fallback values that might be wrong
    }
  };

  // generateFallbackSuggestions removed to prevent incorrect input templates

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    setTestResult(null);

    try {
      const response = await executeAPI.runCode(code, language, sampleInput);

      if (response.data.success) {
        setOutput(response.data.output);

        // Check if output matches expected
        if (expectedOutput.trim()) {
          const matches = response.data.output.trim() === expectedOutput.trim();
          setTestResult(matches);
        }
      } else {
        setOutput(response.data.output || response.data.error || 'Execution failed');
        setTestResult(false);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Error: Failed to execute code.\n${error.message || 'Backend connection failed.'}\n\nPlease ensure the backend server is running.`);
      setTestResult(false);
    } finally {
      setIsRunning(false);
    }
  };

  // Removed misleading simulation logic. 
  // If the backend is down, we should show an error, not fake data.



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Code Runner</h3>
      </div>

      {/* Sample Input/Output */}
      <div className={styles.inputGrid}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Input
            {sampleInput && (
              <LightBulbIcon className={styles.suggestionIcon} title="Auto-suggested" />
            )}
          </label>
          <textarea
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            placeholder="Enter input (numbers, text, multiple lines...)"
            className={styles.input}
            rows={2}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Expected
            {expectedOutput && (
              <LightBulbIcon className={styles.suggestionIcon} title="Auto-suggested" />
            )}
          </label>
          <input
            value={expectedOutput}
            onChange={(e) => setExpectedOutput(e.target.value)}
            placeholder="Expected output"
            className={styles.input}
          />
        </div>
      </div>

      {/* Loading Animation */}
      {isRunning && (
        <div className={styles.loadingContainer}>
          <label className={styles.loadingLabel}>Executing Code...</label>
          <div className={styles.loadingBox}>
            <div className={styles.loadingAnimation}>
              <LoadingAnimation />
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      {output && !isRunning && (
        <div className={styles.outputContainer}>
          <div className={styles.outputHeader}>
            <label className={styles.outputLabel}>Output</label>
            {testResult !== null && (
              <div className={`${styles.testResult} ${testResult ? styles.success : styles.error}`}>
                {testResult ? (
                  <>
                    <CheckCircleIcon className={styles.testIcon} />
                    <span>✓</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className={styles.testIcon} />
                    <span>✗</span>
                  </>
                )}
              </div>
            )}
          </div>
          <pre className={styles.output}>
            {output}
          </pre>
        </div>
      )}

      {/* Sample Code Examples */}
      <div className={styles.hint}>
        <span className={styles.hintIcon}>💡</span>
        Real {language} execution with auto-suggested input/output
      </div>
    </div>
  );
};

export default CodeRunner;