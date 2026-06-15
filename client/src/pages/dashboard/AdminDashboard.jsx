import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import StatCard, { StatCardSkeleton } from '../../components/ui/StatCard';
import NoticeCarousel from '../../components/NoticeCarousel';
import { adminService } from '../../services/adminService';
import {
  FiUsers, FiBook, FiGrid, FiAward, FiBarChart2, FiFileText,
} from 'react-icons/fi';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: '2-digit' });
}

const roleBadge = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getStats()
      .then((data) => setStats(data))
      .catch(() => setError('Failed to load dashboard stats.'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Students',  value: stats.totalStudents,  icon: FiUsers,    color: 'primary'   },
    { label: 'Total Teachers',  value: stats.totalTeachers,  icon: FiUsers,    color: 'secondary' },
    { label: 'Faculties',       value: stats.totalFaculties, icon: FiGrid,     color: 'success'   },
    { label: 'Courses',         value: stats.totalCourses,   icon: FiBook,     color: 'warning'   },
    { label: 'Grades Recorded', value: stats.totalGrades,    icon: FiAward,    color: 'primary'   },
    { label: 'Results Generated', value: stats.totalResults, icon: FiFileText, color: 'secondary' },
  ] : [];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Live overview of the university system</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map((s) => <StatCard key={s.label} {...s} />)
          }
        </div>

        {/* Notice Carousel */}
        <NoticeCarousel limit={5} />

        {/* Recent Registrations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <FiBarChart2 size={18} className="text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Recent Registrations</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-48" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : stats?.recentUsers?.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {stats.recentUsers.map((u) => (
                <li key={u._id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition">
                  <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(u.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No recent registrations.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
