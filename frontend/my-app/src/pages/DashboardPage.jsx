import { useState } from 'react';
import { ChatBubbleLeftRightIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import CodeEditor from '../components/ui/CodeEditor';
import ActionButtons from '../components/ui/ActionButtons';
import ResultsPanel from '../components/ui/ResultsPanel';
import CodeRunner from '../components/ui/CodeRunner';
import DashboardHeader from '../components/layout/DashboardHeader';
import AIChat from '../components/ui/AIChat';
import NotesPanel from '../components/ui/NotesPanel';
import HistoryPanel from '../components/history/HistoryPanel';
import SplitPane from '../components/ui/SplitPane';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const [showAIChat, setShowAIChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className={styles.dashboard}>
      {/* Dark Theme Background */}
      <div className={styles.backgroundEffects}>
        <div className={styles.backgroundOrb1}></div>
        <div className={styles.backgroundOrb2}></div>
        <div className={styles.backgroundOrb3}></div>
        <div className={styles.backgroundGradient}></div>
        <div className={styles.backgroundRadial}></div>
      </div>
      
      {/* Light Theme Background */}
      <div className={styles.lightBackground}></div>
      
      <div className={styles.content}>
        <DashboardHeader />
        
        <div className={styles.mainLayout}>
          <SplitPane
            defaultSplit={70}
            minSplit={50}
            maxSplit={85}
            direction="horizontal"
            leftPane={
              <div className={styles.leftPane}>
                <div className={styles.editorSection}>
                  <CodeEditor />
                </div>
                <div className={styles.actionSection}>
                  <ActionButtons />
                </div>
              </div>
            }
            rightPane={
              <div className={styles.rightPane}>
                <div className={styles.resultsSection}>
                  <ResultsPanel 
                    onShowHistory={() => setShowHistory(true)}
                    onShowNotes={() => setShowNotes(true)}
                  />
                </div>
                <div className={styles.runnerSection}>
                  <CodeRunner />
                </div>
              </div>
            }
          />
        </div>
        
        {/* AI Chat Button - Fixed Position */}
        <button
          type="button"
          onClick={() => setShowAIChat(true)}
          className={styles.aiChatButton}
          title="Talk to AI"
        >
          <ChatBubbleLeftRightIcon className={styles.aiChatIcon} />
        </button>

        {/* AI Chat Modal */}
        {showAIChat && <AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />}
        
        {/* History Panel */}
        <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} />
        
        {/* Notes Panel */}
        <NotesPanel isOpen={showNotes} onClose={() => setShowNotes(false)} />
      </div>
    </div>
  );
};

export default DashboardPage;