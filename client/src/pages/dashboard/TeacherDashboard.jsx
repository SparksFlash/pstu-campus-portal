import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { StatCard, StatCardSkeleton } from '../../components/ui/StatCard';
import NoticeCarousel from '../../components/NoticeCarousel';
import CampusCarousel from '../../components/CampusCarousel';
import teacherService from '../../services/teacherService';
import { FiUsers, FiBook, FiCheckSquare, FiClock, FiEdit3, FiUpload } from 'react-icons/fi';

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherService.getStats()
      .then((data) => setStats(data))
      .catch(() => setStats({ students: 0, courses: 0, gradesEntered: 0, draftGrades: 0, publishedGrades: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your faculty and grading progress</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard label="Students" value={stats.students} icon={FiUsers} color="blue" sublabel="In your faculty" />
              <StatCard label="Courses" value={stats.courses} icon={FiBook} color="purple" sublabel="Faculty courses" />
              <StatCard label="Grades Entered" value={stats.gradesEntered} icon={FiEdit3} color="green" sublabel="By you" />
              <StatCard label="Draft Grades" value={stats.draftGrades} icon={FiClock} color="yellow" sublabel="Not published" />
              <StatCard label="Published" value={stats.publishedGrades} icon={FiCheckSquare} color="teal" sublabel="Visible to students" />
            </>
          )}
        </div>

        {/* Campus image carousel */}
        <CampusCarousel />

        {/* Notice Carousel */}
        <NoticeCarousel limit={5} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/teacher/workflow"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition group"
              >
                <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition">
                  <FiEdit3 size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Enter / Edit Marks</p>
                  <p className="text-xs text-gray-500">Select semester → student → enter marks</p>
                </div>
              </Link>

              <Link
                to="/teacher/publish"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition group"
              >
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                  <FiCheckSquare size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Publish Results</p>
                  <p className="text-xs text-gray-500">Make semester results visible to students</p>
                </div>
              </Link>

              <Link
                to="/teacher/bulk-import"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition group"
              >
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                  <FiUpload size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Bulk CSV Import</p>
                  <p className="text-xs text-gray-500">Upload marks for multiple students at once</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Publishing Status</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total grades entered</span>
                  <span className="font-semibold text-gray-900">{stats.gradesEntered}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: stats.gradesEntered ? `${(stats.publishedGrades / stats.gradesEntered) * 100}%` : '0%' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    Published: {stats.publishedGrades}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
                    Draft: {stats.draftGrades}
                  </span>
                </div>
                <Link
                  to="/teacher/publish"
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium mt-2"
                >
                  Manage publish status →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
