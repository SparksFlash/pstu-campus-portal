import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { FiGlobe, FiUsers, FiCheck, FiClock, FiAlertCircle, FiSearch, FiX } from 'react-icons/fi';
import { institutionService } from '../../services/institutionService';

const statusBadge = {
  Active:   { cls: 'bg-green-100 text-green-700',  icon: FiCheck },
  Pending:  { cls: 'bg-gray-100 text-gray-600',    icon: FiClock },
  Rejected: { cls: 'bg-red-100 text-red-600',      icon: FiX },
};

const planColor = {
  Enterprise: 'bg-purple-100 text-purple-700',
  Pro:        'bg-primary-100 text-primary-700',
  Starter:    'bg-indigo-100 text-indigo-700',
};

function getPlanKey(plan = '') {
  if (plan.startsWith('Enterprise')) return 'Enterprise';
  if (plan.startsWith('Pro')) return 'Pro';
  return 'Starter';
}

function getPlanRevenue(plan = '') {
  if (plan.startsWith('Enterprise')) return 0;
  if (plan.startsWith('Pro')) return 8000;
  return 3000;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InstitutionList() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [acting, setActing]             = useState({});

  useEffect(() => {
    institutionService.getAll()
      .then(res => setInstitutions(res.institutions || res.data?.institutions || []))
      .catch(() => toast.error('Failed to load institutions.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id, status) => {
    setActing(prev => ({ ...prev, [id]: true }));
    try {
      const res = await institutionService.updateStatus(id, status);
      const updated = res.institution || res.data?.institution;
      setInstitutions(prev => prev.map(i => i._id === id ? { ...i, status: updated?.status || status } : i));
      toast.success(`Institution ${status === 'Active' ? 'approved' : 'rejected'} successfully.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed.');
    } finally {
      setActing(prev => ({ ...prev, [id]: false }));
    }
  };

  const filtered = institutions.filter(i =>
    i.universityName?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount    = institutions.filter(i => i.status === 'Active').length;
  const pendingCount   = institutions.filter(i => i.status === 'Pending').length;
  const revenue        = institutions
    .filter(i => i.status === 'Active')
    .reduce((s, i) => s + getPlanRevenue(i.plan), 0);

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
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                {pendingCount} Pending
              </span>
            )}
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full">
              Super Admin View
            </span>
          </div>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Institutions',    value: institutions.length,           color: 'bg-gradient-to-br from-primary-500 to-primary-700' },
            { label: 'Active Subscriptions',  value: activeCount,                   color: 'bg-gradient-to-br from-green-500 to-green-700' },
            { label: 'Pending Requests',      value: pendingCount,                  color: 'bg-gradient-to-br from-amber-500 to-orange-600' },
            { label: 'Monthly Revenue (৳)',   value: `৳${revenue.toLocaleString()}`, color: 'bg-gradient-to-br from-indigo-500 to-indigo-700' },
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
          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading institutions…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Institution</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Plan</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Contact</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Submitted</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(inst => {
                    const badge   = statusBadge[inst.status] || statusBadge.Pending;
                    const planKey = getPlanKey(inst.plan);
                    const busy    = acting[inst._id];
                    return (
                      <tr key={inst._id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FiGlobe size={15} className="text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 leading-tight">{inst.universityName}</p>
                              <p className="text-xs text-gray-400">{inst.location} · {inst.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planColor[planKey]}`}>
                            {planKey}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-gray-700 leading-tight">{inst.contactName}</p>
                          <p className="text-xs text-gray-400">{inst.contactEmail}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                            <badge.icon size={11} /> {inst.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(inst.createdAt)}</td>
                        <td className="px-5 py-4">
                          {inst.status === 'Pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                disabled={busy}
                                onClick={() => handleStatus(inst._id, 'Active')}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                              >
                                {busy ? '…' : 'Approve'}
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => handleStatus(inst._id, 'Rejected')}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                              >
                                {busy ? '…' : 'Reject'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {inst.reviewedAt ? fmtDate(inst.reviewedAt) : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FiGlobe size={32} className="mx-auto mb-2 opacity-30" />
                  <p>{institutions.length === 0 ? 'No institution requests yet.' : 'No results match your search.'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          This view is only visible to platform administrators. Each institution runs as an isolated tenant on EduPortal BD.
        </p>
      </div>
    </Layout>
  );
}
