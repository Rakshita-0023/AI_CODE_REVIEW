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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Profile</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {user?.username || 'Not available'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {user?.email || 'Not available'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member Since
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently joined'}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sign Out
            </button>
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
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