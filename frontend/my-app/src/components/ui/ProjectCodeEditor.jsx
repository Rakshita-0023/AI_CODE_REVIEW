import { Editor } from '@monaco-editor/react';
import useStore from '../../store/useStore';

const ProjectCodeEditor = () => {
  const { code, setCode, theme, language, currentProject } = useStore();

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/30">
      <div className="flex-1">
        <Editor
          height="100%"
          language={currentProject?.language === 'auto' ? 'javascript' : (currentProject?.language || language)}
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

      <div className="px-4 py-2 border-t border-gray-800/50 bg-gray-900/20">
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCodeEditor;