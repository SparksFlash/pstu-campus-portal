import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { StatCard, StatCardSkeleton } from '../../components/ui/StatCard';
import NoticeCarousel from '../../components/NoticeCarousel';
import CampusCarousel from '../../components/CampusCarousel';
import studentService from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { formatCGPA } from '../../utils/formatters';
import { FiBookOpen, FiCheckSquare, FiLayers, FiBarChart2, FiCreditCard, FiArrowRight } from 'react-icons/fi';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    studentService.getDashboardStats()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Campus image carousel — top of page */}
        <CampusCarousel />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>

        {/* Hero banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-primary-100 text-sm font-medium mb-1">Cumulative GPA</p>
              <p className="text-5xl font-bold tracking-tight">
                {loading ? '—' : formatCGPA(stats?.cgpa ?? 0)}
              </p>
              <p className="text-primary-200 text-xs mt-1">Credit-weighted across all semesters</p>
            </div>
            <div className="sm:text-right">
              <p className="text-primary-100 text-sm font-medium mb-1">Current Semester</p>
              <p className="text-4xl font-bold">
                {loading ? '—' : (stats?.currentSemester ?? '—')}
              </p>
              {user?.registrationNumber && (
                <p className="text-primary-200 text-xs mt-1">Reg: {user.registrationNumber}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map(i => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="Enrolled Courses"
                value={stats?.enrolledCourses ?? 0}
                icon={FiBookOpen}
                color="primary"
                sublabel="Currently active"
              />
              <StatCard
                label="Graded Courses"
                value={stats?.gradedCourses ?? 0}
                icon={FiCheckSquare}
                color="success"
                sublabel="Published results"
              />
              <StatCard
                label="Semesters Completed"
                value={stats?.completedSemesters ?? 0}
                icon={FiLayers}
                color="secondary"
                sublabel="With published grades"
              />
            </>
          )}
        </div>

        {/* Notice Carousel */}
        <NoticeCarousel limit={5} />

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/student/results"
            className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2.5 rounded-lg">
                <FiBarChart2 size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">My Results</p>
                <p className="text-xs text-gray-500">View grades and download marksheet</p>
              </div>
            </div>
            <FiArrowRight size={18} className="text-gray-300 group-hover:text-primary-500 transition" />
          </Link>

          <Link
            to="/student/payments"
            className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-lg">
                <FiCreditCard size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Pay Semester Fee</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View breakdown and pay online</p>
              </div>
            </div>
            <FiArrowRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
