import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EllipsisVerticalIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  BeakerIcon,
  CalendarIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { projectAPI } from '../services/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import Pagination from '../components/ui/Pagination';
import { moveToTrash } from '../utils/trashUtils';

const WorkspacesPage = () => {
  const { user, isAuthenticated } = useStore();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
  }, [isAuthenticated, navigate]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null, projectName: '' });
  const [filters, setFilters] = useState({
    type: 'all',
    language: 'all',
    sortBy: 'lastOpened'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchProjects();
  }, [filters, pagination.page, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getProjects({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        type: filters.type !== 'all' ? filters.type : undefined,
        language: filters.language !== 'all' ? filters.language : undefined,
        sortBy: filters.sortBy
      });
      
      setProjects(response.data.projects || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1
      }));
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load workspaces');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (projectId, projectName) => {
    setDeleteModal({ isOpen: true, projectId, projectName });
  };

  const confirmDelete = async () => {
    const { projectId } = deleteModal;
    try {
      const projectToDelete = projects.find(project => project.id === projectId);
      if (projectToDelete) {
        moveToTrash(projectToDelete, 'workspace');
        await projectAPI.deleteProject(projectId);
        setProjects(projects.filter(project => project.id !== projectId));
        toast.success('Workspace moved to trash');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setDeleteModal({ isOpen: false, projectId: null, projectName: '' });
    }
  };



  const getTypeIcon = (type) => {
    switch (type) {
      case 'problem': return <DocumentTextIcon className="w-5 h-5" />;
      case 'project': return <CodeBracketIcon className="w-5 h-5" />;
      default: return <BeakerIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'problem': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'project': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Workspaces</h1>
            <p className="text-gray-400">Manage your coding projects and experiments</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Sandbox</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Types</option>
                <option value="sandbox">Sandbox</option>
                <option value="project">Project</option>
                <option value="problem">Problem</option>
              </select>

              <select
                value={filters.language}
                onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Languages</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="lastOpened">Last Opened</option>
                <option value="created">Date Created</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-3 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/editor/${project.id}`}
                state={{ project }}
                className="group bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg border ${getTypeColor(project.type)}`}>
                    {getTypeIcon(project.type)}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteClick(project.id, project.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg transition-all"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-400 transition-colors">
                  {project.title}
                </h3>
                
                {project.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="capitalize">{project.language}</span>
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(project.lastOpenedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {project.tags && project.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mt-3">
                    <TagIcon className="w-4 h-4 text-gray-500" />
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 2 && (
                        <span className="text-gray-500 text-xs">+{project.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
        
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (projectData) => {
            try {
              const getDefaultCode = (language) => {
                const templates = {
                  javascript: '// Welcome to your new JavaScript project\nconsole.log("Hello, World!");',
                  python: '# Welcome to your new Python project\nprint("Hello, World!")',
                  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
                  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
                  typescript: '// Welcome to your new TypeScript project\nconsole.log("Hello, World!");',
                  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
                  rust: 'fn main() {\n    println!("Hello, World!");\n}'
                };
                return templates[language] || templates.javascript;
              };

              const projectPayload = {
                ...projectData,
                content: getDefaultCode(projectData.language)
              };
              
              const response = await projectAPI.createProject(projectPayload);
              const newProject = response.data;
              
              setProjects(prev => [newProject, ...prev]);
              toast.success('Project created successfully');
              navigate(`/editor/${newProject.id}`, { state: { project: newProject } });
            } catch (error) {
              console.error('Failed to create project:', error);
              toast.error('Failed to create project');
            }
          }}
        />
        
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, projectId: null, projectName: '' })}
          onConfirm={confirmDelete}
          itemType="workspace"
          itemName={deleteModal.projectName}
        />
      </div>
    </div>
  );
};

export default WorkspacesPage;