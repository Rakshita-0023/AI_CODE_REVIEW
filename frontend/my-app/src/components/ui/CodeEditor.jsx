import { Editor } from '@monaco-editor/react';
import { PlayIcon } from '@heroicons/react/24/solid';
import useStore from '../../store/useStore';
import GlassmorphicDropdown from './GlassmorphicDropdown';
import ActionButtons from './ActionButtons';
import styles from './CodeEditor.module.css';

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'swift', label: 'Swift' },
  { value: 'sql', label: 'SQL' },
  { value: 'auto', label: 'Auto-detect' },
];

const CodeEditor = () => {
  const { code, setCode, language, setLanguage, theme } = useStore();

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Code Editor</h3>
          <div className={styles.divider} />
          <ActionButtons />
        </div>
        <div className={styles.controls}>
          <GlassmorphicDropdown
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
            placeholder="Select Language"
          />
          <button
            className={styles.runButton}
            onClick={() => document.dispatchEvent(new CustomEvent('runCode'))}
            title="Run Code (Ctrl+Enter)"
          >
            <PlayIcon className={styles.runIcon} />
            <span className={styles.runText}>Run</span>
          </button>
        </div>
      </div>

      <div className={styles.editorWrapper}>
        <Editor
          height="100%"
          language={language === 'auto' ? 'javascript' : language}
          value={code}
          onChange={handleEditorChange}
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

      <div className={styles.statsContainer}>
        <div className={styles.stat}>
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;