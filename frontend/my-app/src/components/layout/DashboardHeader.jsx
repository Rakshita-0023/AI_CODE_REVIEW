import { 
  SunIcon, 
  MoonIcon, 
  UserCircleIcon,
  ClockIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import ProfileModal from '../auth/ProfileModal';
import HistoryPanel from '../history/HistoryPanel';
import styles from './DashboardHeader.module.css';

const DashboardHeader = () => {
  const { 
    theme, 
    toggleTheme, 
    user, 
    logout
  } = useStore();
  
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <h1 className={styles.logoText}>
              CodeSense
            </h1>
          </div>
          <div className={styles.subtitle}>
            AI Code Reviewer Dashboard
          </div>
        </div>

        <div className={styles.rightSection}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={styles.themeButton}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <MoonIcon className={styles.themeIcon} />
            ) : (
              <SunIcon className={styles.themeIcon} />
            )}
          </button>

          {/* User Menu */}
          <div className={styles.userMenu}>
            <button className={styles.userButton}>
              <UserCircleIcon className={styles.userIcon} />
              <span className={styles.username}>
                {user?.username}
              </span>
            </button>
            
            <div className={styles.dropdown}>
              <div className={styles.dropdownContent}>
                <button
                  onClick={() => setShowProfile(true)}
                  className={styles.dropdownItem}
                >
                  Profile
                </button>
                <div className={styles.dropdownDivider} />
                <button
                  onClick={handleLogout}
                  className={`${styles.dropdownItem} ${styles.logoutButton}`}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ProfileModal 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
      
      <HistoryPanel 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </header>
  );
};

export default DashboardHeader;