import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemType, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Confirm Delete</h3>
        </div>
        
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete this {itemType}? 
          {itemName && (
            <span className="block mt-1 font-medium text-white">"{itemName}"</span>
          )}
          This action will move the item to trash.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 btn btn-destructive"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
