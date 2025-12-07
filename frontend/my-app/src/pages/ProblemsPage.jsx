import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    category: 'all',
    status: 'all',
    sortBy: 'difficulty'
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProblems();
  }, [filters, searchQuery]);

  const fetchProblems = async () => {
    setLoading(true);
    // Mock data for now
    setTimeout(() => {
      const mockProblems = [
        {
          id: '1',
          title: 'Two Sum',
          difficulty: 'easy',
          category: 'Array',
          acceptanceRate: 49.2,
          totalSubmissions: 1234567,
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          tags: ['Array', 'Hash Table'],
          solved: true
        },
        {
          id: '2',
          title: 'Add Two Numbers',
          difficulty: 'medium',
          category: 'Linked List',
          acceptanceRate: 35.8,
          totalSubmissions: 987654,
          description: 'You are given two non-empty linked lists representing two non-negative integers.',
          tags: ['Linked List', 'Math', 'Recursion'],
          solved: false
        },
        {
          id: '3',
          title: 'Median of Two Sorted Arrays',
          difficulty: 'hard',
          category: 'Array',
          acceptanceRate: 32.1,
          totalSubmissions: 543210,
          description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median.',
          tags: ['Array', 'Binary Search', 'Divide and Conquer'],
          solved: false
        },
        {
          id: '4',
          title: 'Longest Palindromic Substring',
          difficulty: 'medium',
          category: 'String',
          acceptanceRate: 31.4,
          totalSubmissions: 876543,
          description: 'Given a string s, return the longest palindromic substring in s.',
          tags: ['String', 'Dynamic Programming'],
          solved: true
        },
        {
          id: '5',
          title: 'Valid Parentheses',
          difficulty: 'easy',
          category: 'Stack',
          acceptanceRate: 40.7,
          totalSubmissions: 654321,
          description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
          tags: ['String', 'Stack'],
          solved: false
        }
      ];
      
      let filtered = mockProblems;
      
      // Apply filters
      if (filters.difficulty !== 'all') {
        filtered = filtered.filter(p => p.difficulty === filters.difficulty);
      }
      if (filters.category !== 'all') {
        filtered = filtered.filter(p => p.category === filters.category);
      }
      if (filters.status !== 'all') {
        filtered = filtered.filter(p => 
          filters.status === 'solved' ? p.solved : !p.solved
        );
      }
      
      // Apply search
      if (searchQuery) {
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      setProblems(filtered);
      setLoading(false);
    }, 500);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'hard': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return <AcademicCapIcon className="w-4 h-4" />;
      case 'medium': return <ClockIcon className="w-4 h-4" />;
      case 'hard': return <FireIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="h-full bg-black text-white relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>

      <div className="relative z-10 h-full overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 min-h-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Coding Problems</h1>
          <p className="text-gray-400">Practice and improve your coding skills</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Categories</option>
                <option value="Array">Array</option>
                <option value="String">String</option>
                <option value="Linked List">Linked List</option>
                <option value="Stack">Stack</option>
                <option value="Tree">Tree</option>
                <option value="Graph">Graph</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Problems</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Problems List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded mb-2 w-1/3"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {problems.map((problem) => (
              <Link
                key={problem.id}
                to={`/problems/${problem.id}`}
                className="group block bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {problem.solved && (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      )}
                      <h3 className="text-lg font-semibold group-hover:text-purple-400 transition-colors">
                        {problem.title}
                      </h3>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                        {getDifficultyIcon(problem.difficulty)}
                        <span className="capitalize">{problem.difficulty}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {problem.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="bg-gray-800 px-2 py-1 rounded-lg">
                          {problem.category}
                        </span>
                        <span>
                          {problem.acceptanceRate}% acceptance
                        </span>
                        <span>
                          {problem.totalSubmissions.toLocaleString()} submissions
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg"
                          >
                            {tag}
                          </span>
                        ))}
                        {problem.tags.length > 3 && (
                          <span className="text-gray-500 text-xs">
                            +{problem.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {problems.length === 0 && !loading && (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center">
            <AcademicCapIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No problems found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ProblemsPage;