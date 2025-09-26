import { Editor } from '@monaco-editor/react';
import useStore from '../../store/useStore';
import GlassmorphicDropdown from './GlassmorphicDropdown';
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
        <h3 className={styles.title}>
          Code Editor
        </h3>
        <div className={styles.controls}>
          <GlassmorphicDropdown
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
            placeholder="Select Language"
          />
        </div>
      </div>
      
      <div className={styles.editorWrapper}>
        <Editor
          height="100%"
          language={language === 'auto' ? 'javascript' : language}
          value={code}
          onChange={handleEditorChange}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
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