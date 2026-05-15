import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, Menu, X, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardLink = user?.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard';

  return (
    <nav
      className={`${
        transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200'
      } sticky top-0 z-50`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">Sky</span><span className="text-xl font-bold text-accent">Hire</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            {/* Browse Jobs is always visible */}
            <Link
              to="/jobs"
              className="text-sm text-gray-600 hover:text-primary font-medium transition-colors"
            >
              Browse Jobs
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardLink}
                  className="text-sm text-gray-600 hover:text-primary font-medium transition-colors"
                >
                  Dashboard
                </Link>
                {user?.role === 'hr' && (
                  <Link
                    to="/hr/jobs"
                    className="text-sm text-gray-600 hover:text-primary font-medium transition-colors"
                  >
                    Manage Jobs
                  </Link>
                )}

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block">{user?.full_name}</span>
                    <ChevronDown size={14} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserCircle size={14} />
                        My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors border border-gray-300 rounded-lg px-4 py-2 hover:border-primary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-accent hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
          {/* Browse Jobs always visible */}
          <Link
            to="/jobs"
            className="block text-sm text-gray-700 font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Browse Jobs
          </Link>
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Link
                to={dashboardLink}
                className="block text-sm text-gray-700 font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm text-gray-700 font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                <UserCircle size={14} />
                My Profile
              </Link>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="flex items-center gap-2 text-sm text-red-600 font-medium py-2"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block text-sm font-medium text-gray-700 py-2"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block text-sm font-medium text-white bg-accent rounded-lg px-4 py-2 text-center"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}

      {/* Close user menu on outside click */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
