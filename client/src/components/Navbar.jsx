import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiLogOut, FiUser, FiLock, FiChevronDown, FiSearch, FiBell } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import { getInitials } from '../utils/formatters';

const Navbar = () => {
  const { user, logout }       = useAuth();
  const { toggleSidebar }      = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);
  const { unreadCount } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const dashboardPath =
    user?.role === 'admin'   ? '/admin/dashboard'   :
    user?.role === 'teacher' ? '/teacher/dashboard' :
    user?.role === 'student' ? '/student/dashboard' : '/';

  const roleColor = {
    admin:   'bg-red-500',
    teacher: 'bg-amber-500',
    student: 'bg-emerald-500',
  }[user?.role] || 'bg-gray-500';

  return (
    <nav className="bg-primary-600 dark:bg-gray-900 text-white shadow-lg z-40 relative">
      <div className="px-4 py-3 flex justify-between items-center">

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="hover:bg-primary-700 dark:hover:bg-gray-700 p-2 rounded-lg transition"
            aria-label="Toggle menu"
          >
            <FiMenu size={22} />
          </button>

          <Link to={dashboardPath} className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center bg-white/95 p-1 rounded-md shadow-sm">
              <img
                src="/assets/logos/logo.png"
                alt="PSTU"
                className="h-8 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="hidden sm:inline text-xl font-bold tracking-tight">PSTU</span>
          </Link>
        </div>

        {/* Right: search hint + theme toggle + user dropdown */}
        <div className="flex items-center gap-2">

          {/* Cmd+K hint — desktop only */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="hidden md:flex items-center gap-2 text-primary-200 dark:text-gray-400 hover:text-white dark:hover:text-white border border-primary-500 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs transition"
          >
            <FiSearch size={13} />
            <span>Search</span>
            <kbd className="bg-primary-700 dark:bg-gray-700 rounded px-1 text-primary-300 dark:text-gray-400">⌘K</kbd>
          </button>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
              className="relative p-2 rounded-lg hover:bg-primary-700 dark:hover:bg-gray-700 transition"
              aria-label="Notifications"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-primary-700 dark:hover:bg-gray-700 transition text-lg"
            aria-label="Toggle dark mode"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 hover:bg-primary-700 dark:hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition"
            >
              {/* Avatar */}
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${roleColor}`}>
                {getInitials(user?.name)}
              </span>
              <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                {user?.name || 'User'}
              </span>
              <FiChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-white text-xs font-medium capitalize ${roleColor}`}>
                    {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <FiUser size={15} className="text-gray-400" /> Profile
                  </Link>
                  <Link
                    to="/profile/change-password"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <FiLock size={15} className="text-gray-400" /> Change Password
                  </Link>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <FiLogOut size={15} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
