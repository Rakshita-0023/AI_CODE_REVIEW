import { useEffect, useRef, useState } from 'react';
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
import { flushWorkspaceSession, recordWorkspaceInteraction, recordWorkspaceOpen } from '../utils/activityTracker';
import toast from 'react-hot-toast';

const EditorPage = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const { currentProject, setCurrentProject, code, setCode, currentAnalysis } = useStore();
  const [activePanel, setActivePanel] = useState('scratchpad');
  const activitySessionRef = useRef(null);

  useEffect(() => {
    const loadProject = async () => {
      const projectFromState = location.state?.project;

      if (projectFromState) {
        setCurrentProject(projectFromState);
        return;
      }

      try {
        const response = await projectAPI.getProject(projectId);
        const project = response.data;
        setCurrentProject(project);

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
  }, [projectId, location.state, setCurrentProject, setCode]);

  useEffect(() => {
    if (!currentProject?.id) return undefined;

    activitySessionRef.current = recordWorkspaceOpen({ projectId: currentProject.id });

    const flushCurrentSession = () => {
      activitySessionRef.current = flushWorkspaceSession(activitySessionRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushCurrentSession();
        return;
      }

      activitySessionRef.current = recordWorkspaceOpen({ projectId: currentProject.id });
    };

    const handleInteraction = () => {
      activitySessionRef.current = recordWorkspaceInteraction(activitySessionRef.current);
    };

    window.addEventListener('beforeunload', flushCurrentSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('beforeunload', flushCurrentSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      flushCurrentSession();
    };
  }, [currentProject?.id]);

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

    const timeoutId = setTimeout(saveProject, 2000);
    return () => clearTimeout(timeoutId);
  }, [code, currentProject]);

  useEffect(() => {
    if (currentAnalysis && activePanel !== 'ai-chat') {
      setActivePanel('results');
    }
  }, [currentAnalysis, activePanel]);

  if (!currentProject) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <EditorNavbar
        onToggleAIChat={() => setActivePanel(activePanel === 'ai-chat' ? 'scratchpad' : 'ai-chat')}
        onToggleScratchpad={() => setActivePanel(activePanel === 'scratchpad' ? 'results' : 'scratchpad')}
        activePanel={activePanel}
      />

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
            activePanel === 'ai-chat' ? (
              <AIChatPanel onClose={() => setActivePanel('scratchpad')} />
            ) : activePanel === 'scratchpad' ? (
              <ScratchpadPanel />
            ) : activePanel === 'results' && currentAnalysis ? (
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
