import { XMarkIcon } from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, logout } = useStore();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    onClose();
  };

  return (
    <div 
      className="fixed top-20 left-0 right-0 bottom-0 flex items-start justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="card w-full max-w-md transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-large)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Username
            </label>
            <div 
              className="p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {user?.username || 'Not available'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <div 
              className="p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {user?.email || 'Not available'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Member Since
            </label>
            <div 
              className="p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently joined'}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--error)',
                color: 'white'
              }}
            >
              Sign Out
            </button>
            <button
              onClick={onClose}
              className="btn flex-1"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;