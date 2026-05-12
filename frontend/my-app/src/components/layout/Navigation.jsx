import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  BookOpenIcon,
  ChartBarIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: location.pathname === '/dashboard' },
    { name: 'Workspaces', href: '/workspaces', icon: CodeBracketIcon, current: location.pathname === '/workspaces' },
    { name: 'AI Chat', href: '/ai-chat', icon: ChatBubbleLeftRightIcon, current: location.pathname === '/ai-chat' },
    { name: 'Notes', href: '/notes', icon: BookOpenIcon, current: location.pathname === '/notes' },
    { name: 'Scratchpads', href: '/scratchpads', icon: DocumentTextIcon, current: location.pathname.startsWith('/scratchpads') },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, current: location.pathname === '/analytics' },
    { name: 'History', href: '/history', icon: ClockIcon, current: location.pathname === '/history' },
    { name: 'Trash', href: '/trash', icon: TrashIcon, current: location.pathname === '/trash' }
  ];

  const NavLinks = ({ close }) => (
    <nav className="flex-1 px-3 pb-4 space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={close}
            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg border transition-all ${
              item.current
                ? 'bg-[rgba(101,163,255,0.12)] border-[rgba(120,170,255,0.35)] text-slate-100'
                : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.08)]'
            }`}
          >
            <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  const UserBlock = () => (
    <div className="flex-shrink-0 border-t border-white/10 p-4">
      <Link
        to="/profile"
        className="flex items-center space-x-3 mb-3 p-2 rounded-lg border border-white/5 hover:bg-white/5 transition-all"
      >
        <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center border border-white/10">
          <span className="text-slate-100 font-semibold text-sm">{user?.fullName?.charAt(0) || 'U'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">{user?.fullName || 'User'}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>
      </Link>

      <button
        onClick={handleLogout}
        className="w-full group flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg border border-transparent hover:bg-[rgba(239,68,68,0.12)] hover:text-rose-200 hover:border-[rgba(239,68,68,0.25)] transition-all"
      >
        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
        Sign Out
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:flex-shrink-0 h-full">
        <div className="flex flex-col h-full bg-[#090b0e] border-r border-white/10 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-5 py-5 border-b border-white/10">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-md bg-slate-100 text-black flex items-center justify-center font-bold text-sm">CS</div>
              <span className="text-base font-semibold tracking-tight text-slate-100">CodeSense AI</span>
            </Link>
          </div>
          <NavLinks />
          <UserBlock />
        </div>
      </div>

      <div className="lg:hidden w-full">
        <div className="flex items-center justify-between bg-[#090b0e] border-b border-white/10 px-4 py-3">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-slate-100 text-black flex items-center justify-center font-bold text-sm">CS</div>
            <span className="text-base font-semibold tracking-tight text-slate-100">CodeSense AI</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            {mobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 w-72 h-full bg-[#090b0e] border-l border-white/10">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-sm font-semibold text-slate-100">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <NavLinks close={() => setMobileMenuOpen(false)} />
              <UserBlock />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Navigation;
