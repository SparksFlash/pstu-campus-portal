import React, { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  FiHome, FiUsers, FiBook, FiBarChart2, FiBookOpen,
  FiCheckSquare, FiUpload, FiGrid, FiShield, FiBell,
  FiTruck, FiPhone, FiUser, FiLogOut,
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const allRoutes = {
  admin: [
    { label: 'Admin Dashboard',  path: '/admin/dashboard',  icon: FiHome    },
    { label: 'Users',            path: '/admin/users',      icon: FiUsers   },
    { label: 'Courses',          path: '/admin/courses',    icon: FiBook    },
    { label: 'Faculties',        path: '/admin/faculties',  icon: FiGrid    },
    { label: 'Audit Log',        path: '/admin/audit-logs', icon: FiShield  },
  ],
  teacher: [
    { label: 'Teacher Dashboard', path: '/teacher/dashboard',  icon: FiHome       },
    { label: 'Enter Marks',       path: '/teacher/workflow',   icon: FiBarChart2  },
    { label: 'Publish Results',   path: '/teacher/publish',    icon: FiCheckSquare},
    { label: 'Bulk Import',       path: '/teacher/bulk-import',icon: FiUpload     },
    { label: 'Students',          path: '/teacher/students',   icon: FiUsers      },
  ],
  student: [
    { label: 'Student Dashboard', path: '/student/dashboard',  icon: FiHome     },
    { label: 'My Results',        path: '/student/results',    icon: FiBarChart2},
    { label: 'Course Enrollment', path: '/student/enrollments',icon: FiBookOpen },
  ],
};

const commonRoutes = [
  { label: 'Notices',      path: '/notices',      icon: FiBell  },
  { label: 'Bus Schedule', path: '/bus-schedule', icon: FiTruck },
  { label: 'Phone Diary',  path: '/phone-diary',  icon: FiPhone },
  { label: 'Profile',      path: '/profile',      icon: FiUser  },
];

export default function CommandPalette() {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const { user, logout }    = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate            = useNavigate();

  const toggle = useCallback(() => {
    setOpen(o => !o);
    setQuery('');
  }, []);

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  const roleRoutes = user?.role ? allRoutes[user.role] || [] : [];
  const routes     = [...roleRoutes, ...commonRoutes];

  const filtered = query
    ? routes.filter(r => r.label.toLowerCase().includes(query.toLowerCase()))
    : routes;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Command shouldFilter={false}>
          <div className="flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-400 text-sm">⌘</span>
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search pages…"
              className="w-full py-4 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <kbd className="hidden sm:inline text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          <Command.List className="max-h-72 overflow-y-auto py-2">
            {filtered.length === 0 && (
              <Command.Empty className="py-8 text-center text-sm text-gray-400">
                No results for "{query}"
              </Command.Empty>
            )}

            {filtered.length > 0 && (
              <Command.Group heading={<span className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Navigation</span>}>
                {filtered.map((route) => (
                  <Command.Item
                    key={route.path}
                    onSelect={() => go(route.path)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/30 aria-selected:text-primary-700 dark:aria-selected:text-primary-300 transition-colors"
                  >
                    <route.icon size={15} className="flex-shrink-0 text-gray-400" />
                    {route.label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-700" />

            <Command.Group heading={<span className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Actions</span>}>
              <Command.Item
                onSelect={toggleTheme}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors"
              >
                <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} mode
              </Command.Item>
              <Command.Item
                onSelect={() => { logout(); navigate('/login'); setOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 dark:text-red-400 transition-colors"
              >
                <FiLogOut size={15} className="flex-shrink-0" />
                Logout
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <span className="text-xs text-gray-400">
              <kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">↑↓</kbd> navigate
            </span>
            <span className="text-xs text-gray-400">
              <kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">↵</kbd> open
            </span>
            <span className="text-xs text-gray-400">
              <kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">Esc</kbd> close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
