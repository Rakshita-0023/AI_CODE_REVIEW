import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CodeBracketIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  BeakerIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { dashboardAPI, isBackendCompatibleToken } from '../services/api';
import useStore from '../store/useStore';


const NewDashboardPage = () => {
  const { user } = useStore();
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalAnalyses: 0,
    totalProblems: 0,
    weeklyActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [isLocalOnlySession, setIsLocalOnlySession] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!isBackendCompatibleToken()) {
      setIsLocalOnlySession(true);
      setRecentProjects([]);
      setRecentNotes([]);
      setStats({
        totalProjects: 0,
        totalAnalyses: 0,
        totalProblems: 0,
        weeklyActivity: 0
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setIsLocalOnlySession(false);

      const response = await dashboardAPI.getSummary();
      const summary = response.data || {};

      setRecentProjects(summary.recentProjects || []);
      setRecentNotes(summary.recentNotes || []);
      setStats(summary.stats || {
        totalProjects: 0,
        totalAnalyses: 0,
        totalProblems: 0,
        weeklyActivity: 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Fallback to empty data
      setRecentProjects([]);
      setRecentNotes([]);
      setStats({
        totalProjects: 0,
        totalAnalyses: 0,
        totalProblems: 0,
        weeklyActivity: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'New Sandbox',
      description: 'Start coding immediately',
      icon: <BeakerIcon className="w-6 h-6" />,
      action: () => createQuickProject('sandbox')
    },
    {
      title: 'AI Chat',
      description: 'Get coding help',
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      link: '/ai-chat'
    },
    {
      title: 'View Analytics',
      description: 'Track your progress',
      icon: <ChartBarIcon className="w-6 h-6" />,
      link: '/analytics'
    }
  ];

  const createQuickProject = async (type) => {
    try {
      // Navigate to workspaces for now
      window.location.href = '/workspaces';
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="h-full bg-black text-white relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent pointer-events-none"></div>

      <div className="relative z-10 h-full overflow-auto">
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.fullName || 'Developer'}! 👋
            </h1>
            <p className="text-gray-400">
              Ready to build something amazing today?
            </p>
            {isLocalOnlySession && (
              <p className="text-sm text-amber-400 mt-3">
                This session is using demo/local sign-in, so backend dashboard data is skipped to avoid slow loading loops.
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-3 bg-gray-700 rounded w-20 mb-2"></div>
                      <div className="h-6 bg-gray-700 rounded w-12"></div>
                    </div>
                    <div className="w-8 h-8 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Projects</p>
                      <p className="text-2xl font-bold">{stats.totalProjects}</p>
                    </div>
                    <CodeBracketIcon className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">AI Analyses</p>
                      <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
                    </div>
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">This Week</p>
                      <p className="text-2xl font-bold">{stats.weeklyActivity}</p>
                    </div>
                    <ChartBarIcon className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                action.link ? (
                  <Link
                    key={index}
                    to={action.link}
                    className="card p-6 rounded-2xl hover:border-white/20 transition-all group block"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-slate-300">{action.icon}</div>
                      <ArrowRightIcon className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-slate-400">{action.description}</p>
                  </Link>
                ) : (
                  <button
                    key={index}
                    onClick={action.action}
                    className="card p-6 rounded-2xl hover:border-white/20 transition-all group text-left w-full"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-slate-300">{action.icon}</div>
                      <ArrowRightIcon className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-slate-400">{action.description}</p>
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Recent Projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Link
                to="/workspaces"
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-3 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/workspaces`}
                    className="group bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:scale-105"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {project.type === 'problem' ? (
                          <DocumentTextIcon className="w-5 h-5 text-orange-400" />
                        ) : project.type === 'project' ? (
                          <CodeBracketIcon className="w-5 h-5 text-blue-400" />
                        ) : (
                          <BeakerIcon className="w-5 h-5 text-purple-400" />
                        )}
                        <span className="text-sm text-gray-400 capitalize">{project.type}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(project.lastOpenedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm capitalize">
                      {project.language}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center">
                <BeakerIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-400 mb-6">Create your first project to get started</p>
                <Link
                  to="/workspaces"
                  className="btn btn-primary px-6 py-3 mx-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Create Project</span>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Notes */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Notes</h2>
              <Link
                to="/notes"
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-3 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : recentNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/notes`}
                    className="group bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:scale-105"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <DocumentTextIcon className="w-5 h-5 text-yellow-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                      {note.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {note.content.substring(0, 100)}...
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                <p className="text-gray-400 mb-6">Create your first note to get started</p>
                <Link
                  to="/notes"
                  className="btn btn-primary px-6 py-3 mx-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Create Note</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboardPage;
