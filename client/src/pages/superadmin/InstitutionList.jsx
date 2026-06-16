import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { FiGlobe, FiUsers, FiCheck, FiClock, FiAlertCircle, FiSearch } from 'react-icons/fi';

const INSTITUTIONS = [
  {
    id: 1, name: 'Patuakhali Science and Technology University (PSTU)',
    location: 'Patuakhali', type: 'Public', plan: 'Pro',
    students: 850, teachers: 62, status: 'Active',
    since: '2024-01-15', email: 'admin@pstu.ac.bd',
  },
  {
    id: 2, name: 'Demo University (Trial)',
    location: 'Dhaka', type: 'Private', plan: 'Starter',
    students: 120, teachers: 14, status: 'Trial',
    since: '2024-06-10', email: 'admin@demouniv.edu.bd',
  },
  {
    id: 3, name: 'Green Valley College',
    location: 'Chittagong', type: 'College', plan: 'Starter',
    students: 340, teachers: 28, status: 'Active',
    since: '2024-03-20', email: 'principal@greenvalley.edu.bd',
  },
  {
    id: 4, name: 'Northern Technical Institute',
    location: 'Rajshahi', type: 'Technical Institute', plan: 'Starter',
    students: 210, teachers: 19, status: 'Pending',
    since: '2024-06-14', email: 'info@nti.edu.bd',
  },
];

const statusBadge = {
  Active:  { cls: 'bg-green-100 text-green-700', icon: FiCheck },
  Trial:   { cls: 'bg-amber-100 text-amber-700', icon: FiClock },
  Pending: { cls: 'bg-gray-100 text-gray-600',   icon: FiAlertCircle },
};

const planColor = {
  Pro:        'bg-primary-100 text-primary-700',
  Starter:    'bg-indigo-100 text-indigo-700',
  Enterprise: 'bg-purple-100 text-purple-700',
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InstitutionList() {
  const [search, setSearch] = useState('');

  const filtered = INSTITUTIONS.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.location.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = INSTITUTIONS.reduce((s, i) => s + i.students, 0);
  const activeCount   = INSTITUTIONS.filter(i => i.status === 'Active').length;
  const revenue       = INSTITUTIONS.filter(i => i.status !== 'Pending').reduce((s, i) => s + (i.plan === 'Pro' ? 8000 : 3000), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <FiGlobe size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
              <p className="text-sm text-gray-500">Platform-wide institution management</p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full self-start">
            Super Admin View
          </span>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Institutions', value: INSTITUTIONS.length, color: 'bg-gradient-to-br from-primary-500 to-primary-700' },
            { label: 'Active Subscriptions', value: activeCount, color: 'bg-gradient-to-br from-green-500 to-green-700' },
            { label: 'Total Students', value: totalStudents.toLocaleString(), color: 'bg-gradient-to-br from-indigo-500 to-indigo-700' },
            { label: 'Monthly Revenue', value: `৳${revenue.toLocaleString()}`, color: 'bg-gradient-to-br from-amber-500 to-orange-600' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-5 text-white`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search institutions…"
            className="input pl-9 w-full"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Institution</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Plan</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Students</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Since</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inst => {
                  const badge = statusBadge[inst.status] || statusBadge.Pending;
                  return (
                    <tr key={inst.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FiGlobe size={15} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 leading-tight">{inst.name}</p>
                            <p className="text-xs text-gray-400">{inst.location} · {inst.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planColor[inst.plan] || 'bg-gray-100 text-gray-600'}`}>
                          {inst.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FiUsers size={13} className="text-gray-400" />
                          {inst.students.toLocaleString()} students · {inst.teachers} teachers
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                          <badge.icon size={11} /> {inst.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(inst.since)}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{inst.email}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FiGlobe size={32} className="mx-auto mb-2 opacity-30" />
              <p>No institutions found</p>
            </div>
          )}
        </div>

        {/* Note */}
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          This view is only visible to platform administrators. Each institution runs as an isolated tenant on EduPortal BD.
        </p>
      </div>
    </Layout>
  );
}
