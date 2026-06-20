import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import NoticeCarousel from '../components/NoticeCarousel';
import {
  FiBarChart2, FiBookOpen, FiCreditCard, FiUser, FiUsers,
  FiEdit3, FiCheckSquare, FiUpload, FiArrowRight,
  FiGrid, FiShield, FiBook, FiBell, FiTruck, FiPhone,
  FiCloud, FiLock, FiCheck,
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

const FEATURES = [
  { icon: FiBarChart2, title: 'Grade Management',  desc: 'Enter, edit and publish semester results with GPA/CGPA auto-calculation.' },
  { icon: FiBell,      title: 'Notice Board',       desc: 'Post and manage notices with expiry dates and faculty filters.' },
  { icon: FiTruck,     title: 'Bus Tracking',       desc: 'Manage campus bus routes, schedules, pickup & drop points.' },
  { icon: FiCreditCard,title: 'Fee Payment',        desc: 'Online fee collection via SSLCommerz with payment history.' },
  { icon: FiLock,      title: 'Role-based Access',  desc: 'Admin, Teacher, Student roles with fine-grained permissions.' },
  { icon: FiCloud,     title: 'Cloud Hosted',       desc: 'Zero installation — runs on any device, deployed on Render + MongoDB Atlas.' },
];

const PLANS = [
  {
    name: 'Starter',
    price: '৳3,000',
    period: '/মাস',
    students: '≤ 500 students',
    highlight: false,
    features: ['Notice Board', 'Bus Schedule', 'Phone Diary', 'Basic Grading', 'Email Verification'],
  },
  {
    name: 'Pro',
    price: '৳8,000',
    period: '/মাস',
    students: '≤ 3,000 students',
    highlight: true,
    features: ['Everything in Starter', 'Online Fee Payment', 'Bulk CSV Import', 'Audit Logs', 'Google Sign-In', 'Priority Support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    students: 'Unlimited students',
    highlight: false,
    features: ['Everything in Pro', 'Custom Branding', 'Dedicated Server', 'SLA Agreement', 'On-site Training'],
  },
];

const PublicLanding = () => (
  <div className="min-h-screen bg-white text-gray-900">
    {/* Navbar */}
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <FiBook size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900">EduPortal BD</span>
      </div>
      <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
        <a href="#features" className="hover:text-primary-600 transition">Features</a>
        <Link to="/pricing" className="hover:text-primary-600 transition">Pricing</Link>
        <Link to="/institution/register" className="hover:text-primary-600 transition">Register</Link>
      </div>
      <div className="flex gap-2">
        <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600 px-3 py-1.5 transition">Login</Link>
        <Link to="/institution/register" className="text-sm font-medium bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 transition">
          Get Started
        </Link>
      </div>
    </nav>

    {/* Hero */}
    <section className="pt-28 pb-20 px-6 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white text-center">
      <div className="max-w-3xl mx-auto">
        <span className="inline-block bg-white/20 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
          SaaS Campus Management Platform
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
          Manage Your University Campus<br />in One Platform
        </h1>
        <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
          EduPortal BD helps universities digitize academic management — grades, notices, payments, bus schedules and more. Subscription-based. No installation required.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/institution/register"
            className="bg-white text-primary-700 font-bold px-7 py-3 rounded-xl hover:bg-primary-50 transition shadow-lg"
          >
            Request a Demo
          </Link>
          <Link
            to="/pricing"
            className="border border-white/40 text-white font-medium px-7 py-3 rounded-xl hover:bg-white/10 transition"
          >
            View Pricing →
          </Link>
        </div>
        <p className="mt-6 text-primary-200 text-sm">
          🏫 Currently serving <strong className="text-white">PSTU</strong> as our pilot institution
        </p>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Everything Your Campus Needs</h2>
        <p className="text-gray-500 text-center mb-12">One platform — Admin, Teachers, and Students all in sync.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="bg-primary-100 p-3 rounded-xl w-fit mb-4">
                <f.icon size={22} className="text-primary-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'University Registers', desc: 'Fill out our institution form and select a subscription plan.' },
            { step: '02', title: 'Admin Onboarded',      desc: 'We set up your portal. Admin adds faculties, courses and users.' },
            { step: '03', title: 'Everyone Uses It',     desc: 'Students and teachers log in immediately — no software to install.' },
          ].map(s => (
            <div key={s.step} className="relative">
              <div className="text-5xl font-black text-primary-100 mb-3">{s.step}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing preview */}
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Simple, Transparent Pricing</h2>
        <p className="text-gray-500 text-center mb-10">Per university, per month. Cancel anytime.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 border transition ${
                plan.highlight
                  ? 'bg-primary-600 text-white border-primary-600 shadow-xl scale-105'
                  : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <span className="inline-block bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-3">
                  MOST POPULAR
                </span>
              )}
              <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-3xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                <span className={`text-sm mb-1 ${plan.highlight ? 'text-primary-200' : 'text-gray-400'}`}>{plan.period}</span>
              </div>
              <p className={`text-xs mb-5 ${plan.highlight ? 'text-primary-200' : 'text-gray-400'}`}>{plan.students}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <FiCheck size={14} className={plan.highlight ? 'text-primary-200' : 'text-green-500'} />
                    <span className={plan.highlight ? 'text-primary-100' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/institution/register"
                className={`block text-center py-2.5 rounded-xl text-sm font-bold transition ${
                  plan.highlight
                    ? 'bg-white text-primary-700 hover:bg-primary-50'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-sm mt-6">Annual billing saves 20% · All prices in BDT</p>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 px-6 bg-gradient-to-r from-indigo-600 to-primary-600 text-white text-center">
      <h2 className="text-3xl font-bold mb-3">Ready to digitize your campus?</h2>
      <p className="text-primary-100 mb-7">Join PSTU and other institutions already using EduPortal BD.</p>
      <Link
        to="/institution/register"
        className="inline-block bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition shadow-lg"
      >
        Register Your Institution →
      </Link>
    </section>

    {/* Footer */}
    <footer className="bg-gray-900 text-gray-400 text-sm px-6 py-8 text-center">
      <p className="font-semibold text-white mb-1">EduPortal BD</p>
      <p>Campus Management SaaS · Made for Bangladeshi Universities</p>
      <div className="flex justify-center gap-5 mt-4">
        <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
        <Link to="/institution/register" className="hover:text-white transition">Register</Link>
        <Link to="/login" className="hover:text-white transition">Login</Link>
      </div>
    </footer>
  </div>
);

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Force light mode on the public landing page — dark mode looks broken here
  useEffect(() => {
    if (!isAuthenticated) {
      const html = document.documentElement;
      const wasDark = html.classList.contains('dark');
      if (wasDark) html.classList.remove('dark');
      return () => { if (wasDark) html.classList.add('dark'); };
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <AuthenticatedHome user={user} />;
  }

  return <PublicLanding />;
};

export default Home;
