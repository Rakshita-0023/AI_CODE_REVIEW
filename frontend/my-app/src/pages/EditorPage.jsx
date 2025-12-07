import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import EditorNavbar from '../components/ui/EditorNavbar';
import ProjectCodeEditor from '../components/ui/ProjectCodeEditor';
import ScratchpadPanel from '../components/ui/ScratchpadPanel';
import AIChatPanel from '../components/ui/AIChatPanel';
import ResultsPanel from '../components/ui/ResultsPanel';
import CodeRunner from '../components/ui/CodeRunner';
import SplitPane from '../components/ui/SplitPane';
import useStore from '../store/useStore';
import { projectAPI } from '../services/api';
import toast from 'react-hot-toast';

const EditorPage = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const { currentProject, setCurrentProject, code, setCode, currentAnalysis } = useStore();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      // Check if project data was passed through navigation state
      const projectFromState = location.state?.project;
      
      if (projectFromState) {
        setCurrentProject(projectFromState);
        return;
      }

      // Try to fetch project from API
      try {
        const response = await projectAPI.getProject(projectId);
        const project = response.data;
        setCurrentProject(project);
        
        // Set the main file content if available
        if (project.Files && project.Files.length > 0) {
          const mainFile = project.Files.find(f => f.isMain) || project.Files[0];
          setCode(mainFile.content || '');
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
        toast.error('Failed to load project');
      }
    };

    loadProject();
  }, [projectId, location.state, setCurrentProject]);

  // Auto-save project changes
  useEffect(() => {
    if (!currentProject) return;
    
    const saveProject = async () => {
      try {
        await projectAPI.updateProject(currentProject.id, {
          content: code,
          lastOpenedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to save project:', error);
      }
    };

    const timeoutId = setTimeout(saveProject, 2000); // Auto-save after 2 seconds of inactivity
    return () => clearTimeout(timeoutId);
  }, [code, currentProject]);

  if (!currentProject) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Navbar */}
      <EditorNavbar 
        onToggleAIChat={() => setShowAIChat(!showAIChat)} 
        onToggleScratchpad={() => setShowScratchpad(!showScratchpad)}
      />

      {/* Main Content */}
      <div className="flex-1">
        <SplitPane
          defaultSplit={60}
          minSplit={30}
          maxSplit={80}
          leftPane={
            <SplitPane
              direction="vertical"
              defaultSplit={70}
              minSplit={40}
              maxSplit={85}
              leftPane={<ProjectCodeEditor />}
              rightPane={<CodeRunner />}
            />
          }
          rightPane={
            showAIChat ? (
              <AIChatPanel onClose={() => setShowAIChat(false)} />
            ) : showScratchpad ? (
              <ScratchpadPanel />
            ) : currentAnalysis ? (
              <ResultsPanel />
            ) : (
              <ScratchpadPanel />
            )
          }
        />
      </div>
    </div>
  );
};

export default EditorPage;