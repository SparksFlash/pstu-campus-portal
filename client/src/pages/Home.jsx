import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import NoticeCarousel from '../components/NoticeCarousel';
import {
  FiBarChart2, FiBookOpen, FiCreditCard, FiUser, FiUsers,
  FiEdit3, FiCheckSquare, FiUpload, FiArrowRight,
  FiGrid, FiShield, FiBook,
} from 'react-icons/fi';

const studentLinks = [
  { to: '/student/overview',   icon: FiGrid,       label: 'Overview',        color: 'bg-primary-50 text-primary-600' },
  { to: '/student/results',    icon: FiBarChart2,  label: 'My Results',      color: 'bg-indigo-50 text-indigo-600' },
  { to: '/student/enrollments',icon: FiBookOpen,   label: 'Enrollment',      color: 'bg-green-50 text-green-700' },
  { to: '/student/payments',   icon: FiCreditCard, label: 'Pay Fees',        color: 'bg-amber-50 text-amber-700' },
  { to: '/profile',            icon: FiUser,       label: 'My Profile',      color: 'bg-rose-50 text-rose-600' },
  { to: '/notices',            icon: FiBarChart2,  label: 'Notice Board',    color: 'bg-sky-50 text-sky-600' },
];

const teacherLinks = [
  { to: '/teacher/overview',   icon: FiGrid,       label: 'Overview',        color: 'bg-primary-50 text-primary-600' },
  { to: '/teacher/workflow',   icon: FiEdit3,      label: 'Enter Marks',     color: 'bg-indigo-50 text-indigo-600' },
  { to: '/teacher/publish',    icon: FiCheckSquare,label: 'Publish Results', color: 'bg-green-50 text-green-700' },
  { to: '/teacher/students',   icon: FiUsers,      label: 'Students',        color: 'bg-amber-50 text-amber-700' },
  { to: '/teacher/bulk-import',icon: FiUpload,     label: 'Bulk Import',     color: 'bg-purple-50 text-purple-700' },
  { to: '/profile',            icon: FiUser,       label: 'My Profile',      color: 'bg-rose-50 text-rose-600' },
];

const adminLinks = [
  { to: '/admin/dashboard',    icon: FiGrid,       label: 'Dashboard',       color: 'bg-primary-50 text-primary-600' },
  { to: '/admin/users',        icon: FiUsers,      label: 'Users',           color: 'bg-indigo-50 text-indigo-600' },
  { to: '/admin/courses',      icon: FiBook,       label: 'Courses',         color: 'bg-green-50 text-green-700' },
  { to: '/admin/faculties',    icon: FiGrid,       label: 'Faculties',       color: 'bg-amber-50 text-amber-700' },
  { to: '/admin/payments',     icon: FiCreditCard, label: 'Payments',        color: 'bg-rose-50 text-rose-600' },
  { to: '/admin/audit-logs',   icon: FiShield,     label: 'Audit Log',       color: 'bg-purple-50 text-purple-700' },
];

const gradients = {
  admin:   'from-violet-600 to-purple-700',
  teacher: 'from-primary-600 to-primary-700',
  student: 'from-emerald-500 to-teal-600',
};

const subtitles = {
  admin:   'Manage the entire university system',
  teacher: 'Grade students and publish results',
  student: 'Track your academic journey',
};

const AuthenticatedHome = ({ user }) => {
  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'teacher' ? teacherLinks
    : studentLinks;

  const dashPath = user?.role === 'admin' ? '/admin/dashboard'
    : user?.role === 'teacher' ? '/teacher/dashboard'
    : '/student/dashboard';

  return (
    <Layout>
      <div className="space-y-7">
        {/* Welcome banner */}
        <div className={`bg-gradient-to-r ${gradients[user?.role] || 'from-gray-600 to-gray-700'} rounded-2xl p-7 text-white shadow-lg`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1 uppercase tracking-wide">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Portal
              </p>
              <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
              <p className="text-white/80 mt-1">{subtitles[user?.role]}</p>
            </div>
            <Link
              to={dashPath}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition self-start"
            >
              Go to Dashboard <FiArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Notice Carousel */}
        <NoticeCarousel limit={6} />

        {/* Quick navigation */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition group text-center"
              >
                <div className={`p-2.5 rounded-xl ${link.color} group-hover:scale-110 transition-transform`}>
                  <link.icon size={18} />
                </div>
                <span className="text-xs font-medium text-gray-700 leading-tight">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Info strip */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 px-6 py-4 flex flex-wrap gap-6 text-sm text-gray-500">
          <span>🏫 Patuakhali Science and Technology University</span>
          <span>🎓 Campus Academic Portal</span>
          {user?.registrationNumber && <span>📋 Reg: {user.registrationNumber}</span>}
          {user?.employeeId && <span>🪪 Employee: {user.employeeId}</span>}
        </div>
      </div>
    </Layout>
  );
};

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <AuthenticatedHome user={user} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <div className="text-center text-white max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">PSTU Web Application</h1>
        <p className="text-xl mb-8 opacity-90">
          Patuakhali Science and Technology University — Educational Management System
        </p>
        <button
          onClick={() => navigate('/login')}
          className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Home;
