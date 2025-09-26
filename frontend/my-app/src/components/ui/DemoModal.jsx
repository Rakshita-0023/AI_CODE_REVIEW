import { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DemoModal = ({ isOpen, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            CodeSense Demo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-6">
          <video
            ref={videoRef}
            controls
            autoPlay
            muted
            className="w-full h-auto rounded-lg shadow-lg"
            onError={(e) => console.error('Video error:', e.target.error)}
            onCanPlay={() => console.log('Video can play')}
          >
            <source src="/demo-video.mov" type="video/quicktime" />
            <source src="/demo-video.mov" type="video/mp4" />
            <p className="text-center text-gray-600 dark:text-gray-400 p-8">
              Your browser does not support the video tag. Please try a different browser or 
              <a href="/demo-video.mov" className="text-purple-600 hover:underline" download>
                download the video
              </a>
            </p>
          </video>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Watch how CodeSense analyzes, debugs, and optimizes your code with AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;