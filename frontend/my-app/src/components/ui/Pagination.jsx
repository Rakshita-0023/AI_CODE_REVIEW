import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Always show pagination component

  const getVisiblePages = () => {
    if (totalPages <= 1) return [1];
    
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return [...new Set(rangeWithDots)];
  };

  return (
    <div className="fixed bottom-0 left-64 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 py-4 z-40">
      <div className="flex items-center justify-center px-6">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-ghost btn-icon"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-indigo-500/80 text-white border border-indigo-300/40'
                  : page === '...'
                  ? 'text-gray-500 cursor-default'
                  : 'hover:bg-gray-800 text-gray-300 border border-transparent'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages <= 1}
            className="btn btn-ghost btn-icon"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="absolute right-6 text-xs text-gray-500">
          {currentPage} / {Math.max(1, totalPages)}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
