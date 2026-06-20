import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBarChart2, FiCalendar, FiBell, FiMenu, FiUsers } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';

const TAB_SETS = {
  student: [
    { label: 'Home',    icon: FiHome,      path: '/student/dashboard' },
    { label: 'Results', icon: FiBarChart2,  path: '/student/results'   },
    { label: 'Routine', icon: FiCalendar,   path: '/class-routine'     },
    { label: 'Notices', icon: FiBell,       path: '/notices'           },
  ],
  teacher: [
    { label: 'Home',    icon: FiHome,      path: '/teacher/dashboard' },
    { label: 'Marks',   icon: FiBarChart2,  path: '/teacher/workflow'  },
    { label: 'Routine', icon: FiCalendar,   path: '/class-routine'     },
    { label: 'Notices', icon: FiBell,       path: '/notices'           },
  ],
  admin: [
    { label: 'Home',    icon: FiHome,      path: '/admin/dashboard'   },
    { label: 'Users',   icon: FiUsers,     path: '/admin/users'       },
    { label: 'Routine', icon: FiCalendar,  path: '/class-routine'     },
    { label: 'Notices', icon: FiBell,      path: '/notices'           },
  ],
};

export default function BottomNav() {
  const { user, isAuthenticated } = useAuth();
  const { toggleSidebar }         = useApp();
  const location                  = useLocation();

  if (!isAuthenticated) return null;

  const tabs = TAB_SETS[user?.role] || TAB_SETS.student;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <nav className="
        bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
        rounded-2xl border border-gray-100 dark:border-gray-800
        shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        flex items-stretch h-[60px] px-1
      ">
        {tabs.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-150"
            >
              <Icon
                size={20}
                className={active ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'}
              />
              <span className={`text-[10px] font-semibold leading-none ${active ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'}`}>
                {label}
              </span>
              <span className={`w-1 h-1 rounded-full mt-0.5 transition-all duration-150 ${active ? 'bg-primary-600' : 'bg-transparent'}`} />
            </Link>
          );
        })}

        {/* Menu tab — opens sidebar drawer */}
        <button
          onClick={toggleSidebar}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-150"
        >
          <FiMenu size={20} className="text-gray-400 dark:text-gray-500" />
          <span className="text-[10px] font-semibold leading-none text-gray-400 dark:text-gray-500">Menu</span>
          <span className="w-1 h-1 rounded-full mt-0.5 bg-transparent" />
        </button>
      </nav>
    </div>
  );
}
