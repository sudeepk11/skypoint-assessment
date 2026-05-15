import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  FileText,
  PlusCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCircle,
  Moon,
  Sun,
  Users,
  Bell,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HRLayoutProps {
  children: React.ReactNode;
}

export const HRLayout: React.FC<HRLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/hr/dashboard',       label: 'Dashboard',      icon: LayoutDashboard },
    { to: '/hr/jobs',            label: 'Manage Jobs',     icon: Briefcase },
    { to: '/hr/applications',    label: 'Applications',    icon: Inbox },
    { to: '/hr/talent-network',  label: 'Talent Network',  icon: Users },
    { to: '/profile',            label: 'My Profile',      icon: UserCircle },
    { to: '/hr/jobs/new',        label: 'Post New Job',    icon: PlusCircle, highlight: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-surface dark:bg-[#131c2e]">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-primary z-50 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 lg:flex-shrink-0 dark:border-r dark:border-white/5 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Link to="/hr/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-white">Sky</span><span className="text-xl font-bold text-blue-400">Hire</span>
          </Link>
          <button
            className="lg:hidden text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, icon: Icon, highlight }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive(to)
                  ? 'bg-white/15 text-white'
                  : highlight
                  ? 'text-blue-300 hover:bg-white/10 hover:text-white border border-blue-400/30 mt-2'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
              {isActive(to) && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content — takes remaining width, scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 h-14 flex items-center gap-3 flex-shrink-0 z-30">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="hidden sm:block">
            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium leading-none mb-0.5">HR Portal</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
              {navLinks.find(l => location.pathname.startsWith(l.to) && l.to !== '/hr/dashboard')?.label
                ?? (location.pathname === '/hr/dashboard' ? 'Dashboard' : '')}
            </p>
          </div>

          <div className="flex-1" />

          {/* Quick action */}
          <Link
            to="/hr/jobs/new"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={13} />
            Post Job
          </Link>

          {/* Dark mode */}
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Avatar + name */}
          <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
            <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block font-medium">{user?.full_name}</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto dark:bg-[#131c2e]">{children}</main>
      </div>
    </div>
  );
};

interface CandidateLayoutProps {
  children: React.ReactNode;
}

export const CandidateLayout: React.FC<CandidateLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending invite count for badge
  React.useEffect(() => {
    import('../services/api').then(({ connections: connApi }) => {
      connApi.pending().then((list) => setPendingCount(list.length)).catch(() => {});
    });
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/candidate/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/candidate/jobs',         label: 'Browse Jobs',     icon: Briefcase },
    { to: '/candidate/applications', label: 'My Applications', icon: FileText },
    { to: '/candidate/connections',  label: 'Job Invites',     icon: Users },
    { to: '/profile',                label: 'My Profile',      icon: UserCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-surface dark:bg-[#131c2e]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-primary z-50 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 lg:flex-shrink-0 dark:border-r dark:border-white/5 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Link to="/candidate/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-white">Sky</span>
            <span className="text-xl font-bold text-blue-400">Hire</span>
          </Link>
          <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(to)
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
              {to === '/candidate/connections' && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {pendingCount}
                </span>
              )}
              {isActive(to) && to !== '/candidate/connections' && <ChevronRight size={14} className="ml-auto" />}
              {isActive(to) && to === '/candidate/connections' && pendingCount === 0 && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 h-14 flex items-center gap-3 flex-shrink-0 z-30">
          <button className="lg:hidden text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="hidden sm:block">
            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium leading-none mb-0.5">Candidate Portal</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
              {navLinks.find(l => location.pathname.startsWith(l.to) && l.to !== '/candidate/dashboard')?.label
                ?? (location.pathname === '/candidate/dashboard' ? 'Dashboard' : '')}
            </p>
          </div>

          <div className="flex-1" />

          {/* Browse jobs quick action */}
          <Link
            to="/candidate/jobs"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search size={13} />
            Browse Jobs
          </Link>

          {/* Pending invites bell */}
          <Link
            to="/candidate/connections"
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all"
            aria-label="Job invites"
          >
            <Bell size={16} />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>

          {/* Dark mode */}
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Avatar + name */}
          <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
            <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block font-medium">{user?.full_name}</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto dark:bg-[#131c2e]">{children}</main>
      </div>
    </div>
  );
};
