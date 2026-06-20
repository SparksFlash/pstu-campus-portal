import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiUsers, FiBook, FiBarChart2, FiBell,
  FiTruck, FiPhone, FiGrid, FiShield, FiCheckSquare,
  FiUpload, FiBookOpen, FiX, FiCreditCard, FiList, FiLayout, FiGlobe, FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';

const Sidebar = () => {
  const { user }              = useAuth();
  const { sidebarOpen, toggleSidebar } = useApp();
  const location              = useLocation();

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isActive = (path) =>
    location.pathname === path
      ? 'bg-primary-600 text-white'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white';

  const menuItems = [
    { label: 'Home',      path: '/',          icon: FiHome },
    {
      label: 'Dashboard',
      path: `/${user?.role === 'admin' ? 'admin' : user?.role === 'teacher' ? 'teacher' : 'student'}/dashboard`,
      icon: FiHome,
    },
  ];

  if (user?.role === 'admin') {
    menuItems.push(
      { label: 'Users',         path: '/admin/users',               icon: FiUsers      },
      { label: 'Courses',       path: '/admin/courses',             icon: FiBook       },
      { label: 'Faculties',     path: '/admin/faculties',           icon: FiGrid       },
      { label: 'Payments',      path: '/admin/payments',            icon: FiCreditCard },
      { label: 'Audit Log',     path: '/admin/audit-logs',          icon: FiShield     },
      { label: 'Institutions',  path: '/superadmin/institutions',   icon: FiGlobe      },
    );
  }

  if (user?.role === 'teacher') {
    menuItems.push(
      { label: 'Overview',        path: '/teacher/overview',    icon: FiLayout      },
      { label: 'Enter Marks',     path: '/teacher/workflow',    icon: FiBarChart2   },
      { label: 'Publish Results', path: '/teacher/publish',     icon: FiCheckSquare },
      { label: 'Bulk Import',     path: '/teacher/bulk-import', icon: FiUpload      },
      { label: 'Students',        path: '/teacher/students',    icon: FiUsers       },
    );
  }

  if (user?.role === 'student') {
    menuItems.push(
      { label: 'Overview',        path: '/student/overview',        icon: FiLayout     },
      { label: 'My Results',      path: '/student/results',         icon: FiBarChart2  },
      { label: 'Enrollment',      path: '/student/enrollments',     icon: FiBookOpen   },
      { label: 'Pay Fees',        path: '/student/payments',        icon: FiCreditCard },
      { label: 'Payment History', path: '/student/payments/history', icon: FiList      },
    );
  }

  menuItems.push(
    { label: 'Notices',       path: '/notices',       icon: FiBell     },
    { label: 'Bus Schedule',  path: '/bus-schedule',  icon: FiTruck    },
    { label: 'Phone Diary',   path: '/phone-diary',   icon: FiPhone    },
    { label: 'Class Routine', path: '/class-routine', icon: FiCalendar },
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (!sidebarOpen && !isMobile) return null;

  return (
    <>
      {/* Mobile backdrop — fades in/out */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* Sidebar panel — slides in/out on mobile */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 md:z-auto
        w-64 bg-gray-900 dark:bg-gray-950 text-white shadow-lg
        flex-shrink-0 flex flex-col
        h-full md:h-auto md:min-h-screen
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 md:hidden">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Menu</p>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            aria-label="Close sidebar"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <p className="hidden md:block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 px-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${isActive(item.path)}`}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
