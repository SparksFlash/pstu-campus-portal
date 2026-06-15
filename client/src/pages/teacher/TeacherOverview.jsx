import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import NoticeCarousel from '../../components/NoticeCarousel';
import teacherService from '../../services/teacherService';
import { phoneService } from '../../services/phoneService';
import { useAuth } from '../../hooks/useAuth';
import {
  FiUsers, FiBook, FiClock, FiCheckSquare,
  FiEdit3, FiUpload, FiPhone, FiArrowRight, FiMail,
} from 'react-icons/fi';

function StatGradient({ icon: Icon, label, value, gradient, sublabel }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-sm ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="bg-white/20 p-2.5 rounded-xl">
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold">{value ?? '—'}</p>
      <p className="text-sm font-medium mt-1 text-white/90">{label}</p>
      {sublabel && <p className="text-xs text-white/60 mt-0.5">{sublabel}</p>}
    </div>
  );
}

export default function TeacherOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      teacherService.getStats(),
      phoneService.getAllPhoneEntries(),
    ]).then(([statsRes, contactsRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (contactsRes.status === 'fulfilled') {
        const all = Array.isArray(contactsRes.value) ? contactsRes.value : [];
        setContacts(all.slice(0, 3));
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-7">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}</p>
        </div>

        {/* Notice Carousel */}
        <NoticeCarousel limit={6} />

        {/* Teaching summary cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Teaching Summary</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatGradient
              icon={FiUsers}
              label="My Students"
              value={loading ? '…' : (stats?.students ?? 0)}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              sublabel="In your faculty"
            />
            <StatGradient
              icon={FiBook}
              label="My Courses"
              value={loading ? '…' : (stats?.courses ?? 0)}
              gradient="bg-gradient-to-br from-purple-500 to-purple-700"
              sublabel="Faculty courses"
            />
            <StatGradient
              icon={FiClock}
              label="Draft Grades"
              value={loading ? '…' : (stats?.draftGrades ?? 0)}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              sublabel="Not yet published"
            />
            <StatGradient
              icon={FiCheckSquare}
              label="Published"
              value={loading ? '…' : (stats?.publishedGrades ?? 0)}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              sublabel="Visible to students"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/teacher/students',   icon: FiUsers,      label: 'Students',     color: 'bg-blue-50 text-blue-700' },
              { to: '/teacher/workflow',   icon: FiEdit3,      label: 'Enter Marks',  color: 'bg-primary-50 text-primary-600' },
              { to: '/teacher/publish',    icon: FiCheckSquare, label: 'Publish',     color: 'bg-green-50 text-green-700' },
              { to: '/teacher/bulk-import', icon: FiUpload,    label: 'Bulk Import',  color: 'bg-purple-50 text-purple-700' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition group text-center"
              >
                <div className={`p-3 rounded-xl ${link.color} group-hover:scale-110 transition-transform`}>
                  <link.icon size={20} />
                </div>
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
                <FiArrowRight size={13} className="text-gray-300 group-hover:text-primary-500 transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Publish progress bar */}
        {stats && (stats.gradesEntered > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Grade Publishing Progress</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Published: <strong className="text-green-600">{stats.publishedGrades}</strong></span>
                <span>Draft: <strong className="text-amber-600">{stats.draftGrades}</strong></span>
                <span>Total: <strong>{stats.gradesEntered}</strong></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${(stats.publishedGrades / stats.gradesEntered) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-right">
                {Math.round((stats.publishedGrades / stats.gradesEntered) * 100)}% published
              </p>
            </div>
            <Link
              to="/teacher/publish"
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage publish status <FiArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Phone Directory preview */}
        {contacts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FiPhone size={17} className="text-indigo-600" />
                <h2 className="text-base font-semibold text-gray-800">Key Contacts</h2>
              </div>
              <Link to="/phone-diary" className="text-xs text-primary-600 hover:underline">View directory →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {contacts.map(c => (
                <div key={c._id} className="px-6 py-3 flex items-center gap-4">
                  <div className="bg-indigo-100 p-2 rounded-lg flex-shrink-0">
                    <FiPhone size={14} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.contactPerson}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {c.designation}{c.department ? ` · ${c.department}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition"
                      >
                        <FiPhone size={11} /> Call
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition"
                      >
                        <FiMail size={11} /> Email
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
