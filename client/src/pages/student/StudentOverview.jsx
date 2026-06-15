import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import NoticeCarousel from '../../components/NoticeCarousel';
import studentService from '../../services/studentService';
import { busService } from '../../services/busService';
import { useAuth } from '../../hooks/useAuth';
import { formatCGPA } from '../../utils/formatters';
import {
  FiBarChart2, FiBookOpen, FiLayers, FiCheckSquare,
  FiCreditCard, FiUser, FiTruck, FiClock, FiMapPin, FiArrowRight,
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

export default function StudentOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      studentService.getDashboardStats(),
      busService.getAllBusSchedules(),
    ]).then(([statsRes, busRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (busRes.status === 'fulfilled') setBuses(
        Array.isArray(busRes.value) ? busRes.value.slice(0, 3) : []
      );
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

        {/* Notice Carousel — full prominence */}
        <NoticeCarousel limit={6} />

        {/* Academic summary stat cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Academic Summary</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatGradient
              icon={FiBarChart2}
              label="Cumulative GPA"
              value={loading ? '…' : formatCGPA(stats?.cgpa ?? 0)}
              gradient="bg-gradient-to-br from-primary-500 to-primary-700"
              sublabel="Credit-weighted"
            />
            <StatGradient
              icon={FiLayers}
              label="Current Semester"
              value={loading ? '…' : (user?.semester ?? stats?.currentSemester ?? '—')}
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
              sublabel="Enrolled semester"
            />
            <StatGradient
              icon={FiBookOpen}
              label="Enrolled Courses"
              value={loading ? '…' : (stats?.enrolledCourses ?? 0)}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              sublabel="Active courses"
            />
            <StatGradient
              icon={FiCheckSquare}
              label="Graded Courses"
              value={loading ? '…' : (stats?.gradedCourses ?? 0)}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              sublabel="Published results"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/student/results',      icon: FiBarChart2,  label: 'My Results',   color: 'bg-primary-50 text-primary-600' },
              { to: '/student/enrollments',  icon: FiBookOpen,   label: 'Enrollment',   color: 'bg-green-50 text-green-700' },
              { to: '/student/payments',     icon: FiCreditCard, label: 'Pay Fees',     color: 'bg-amber-50 text-amber-700' },
              { to: '/profile',              icon: FiUser,       label: 'My Profile',   color: 'bg-indigo-50 text-indigo-700' },
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

        {/* Bus Schedule preview */}
        {buses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FiTruck size={17} className="text-green-600" />
                <h2 className="text-base font-semibold text-gray-800">Bus Schedule Preview</h2>
              </div>
              <Link to="/bus-schedule" className="text-xs text-primary-600 hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {buses.map(bus => (
                <div key={bus._id} className="px-6 py-3 flex items-center gap-4">
                  <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                    <FiTruck size={16} className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {bus.busNumber} {bus.routeName ? `· ${bus.routeName}` : ''}
                    </p>
                    {bus.pickupPoints?.filter(p => p.location).length > 0 && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <FiMapPin size={10} />
                        {bus.pickupPoints.filter(p => p.location)[0]?.location}
                        {bus.pickupPoints.filter(p => p.location)[0]?.time && (
                          <span className="flex items-center gap-0.5 ml-1">
                            <FiClock size={10} /> {bus.pickupPoints[0].time}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    {bus.daysOfOperation?.length === 7 ? 'Daily' : (bus.daysOfOperation?.map(d => d.slice(0, 3)).join(', ') || '—')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
