import React, { useState, useEffect, useCallback } from 'react';
import { FiLoader, FiCheckCircle, FiXCircle, FiClock, FiSlash, FiDollarSign, FiSettings, FiSave } from 'react-icons/fi';
import paymentService from '../../services/paymentService';

const STATUS_CFG = {
  completed: { label: 'Paid',      cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   Icon: FiCheckCircle },
  pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Icon: FiClock },
  failed:    { label: 'Failed',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           Icon: FiXCircle },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',          Icon: FiSlash },
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-xl p-5 shadow-sm border-gray-200 dark:border-gray-700`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PaymentDashboard() {
  const [stats, setStats]           = useState(null);
  const [payments, setPayments]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ status: '', semester: '' });

  // Fee config state
  const [feeConfigs, setFeeConfigs] = useState([]);
  const [feeTab, setFeeTab]         = useState(false);
  const [feeForm, setFeeForm]       = useState({ semester: 1, amount: '', description: '', academicYear: '' });
  const [savingFee, setSavingFee]   = useState(false);
  const [feeMsg, setFeeMsg]         = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const [pRes, sRes] = await Promise.all([
        paymentService.getAllPayments(params),
        paymentService.getPaymentStats(),
      ]);
      setPayments(pRes.payments || []);
      setTotal(pRes.total || 0);
      setTotalPages(pRes.totalPages || 1);
      setStats(sRes);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    paymentService.getFeeConfig().then(cfg => setFeeConfigs(Array.isArray(cfg) ? cfg : [])).catch(() => {});
  }, []);

  const applyFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const saveFeeConfig = async () => {
    setSavingFee(true); setFeeMsg('');
    try {
      await paymentService.setFeeConfig(feeForm);
      setFeeMsg('Fee config saved!');
      const cfg = await paymentService.getFeeConfig();
      setFeeConfigs(Array.isArray(cfg) ? cfg : []);
    } catch (err) {
      setFeeMsg(err?.response?.data?.message || 'Failed to save.');
    } finally { setSavingFee(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor all student payment transactions.</p>
        </div>
        <button
          onClick={() => setFeeTab(t => !t)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition"
        >
          <FiSettings size={14} /> Fee Config
        </button>
      </div>

      {/* Fee Config Panel */}
      {feeTab && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Configure Semester Fees</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[1,2,3,4,5,6,7,8].map(s => {
              const existing = feeConfigs.find(c => c.semester === s);
              return (
                <div
                  key={s}
                  onClick={() => setFeeForm({ semester: s, amount: existing?.amount || '', description: existing?.description || '', academicYear: existing?.academicYear || '' })}
                  className={`cursor-pointer border rounded-lg p-3 text-center text-sm transition
                    ${feeForm.semester === s ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Sem {s}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {existing ? `BDT ${existing.amount?.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Semester</label>
              <input type="number" min="1" max="8" value={feeForm.semester}
                onChange={e => setFeeForm(f => ({ ...f, semester: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount (BDT)</label>
              <input type="number" min="0" value={feeForm.amount}
                onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Academic Year</label>
              <input type="text" value={feeForm.academicYear}
                onChange={e => setFeeForm(f => ({ ...f, academicYear: e.target.value }))}
                placeholder="e.g. 2025-2026"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
              <input type="text" value={feeForm.description}
                onChange={e => setFeeForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional note"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={saveFeeConfig} disabled={savingFee}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-60">
              {savingFee ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
              Save Fee
            </button>
            {feeMsg && <span className={`text-sm ${feeMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>{feeMsg}</span>}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total"     value={stats.total}     />
          <StatCard label="Completed" value={stats.completed} color="text-green-600" />
          <StatCard label="Pending"   value={stats.pending}   color="text-yellow-600" />
          <StatCard label="Failed"    value={stats.failed}    color="text-red-600" />
          <StatCard label="Cancelled" value={stats.cancelled} color="text-gray-500" />
          <StatCard
            label="Total Revenue"
            value={`৳${(stats.totalRevenue || 0).toLocaleString()}`}
            color="text-primary-600 dark:text-primary-400"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status}
            onChange={e => applyFilter('status', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.semester}
            onChange={e => applyFilter('semester', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{total} record{total !== 1 ? 's' : ''} found</p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <FiLoader className="animate-spin text-primary-600" size={26} />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiDollarSign size={36} className="mx-auto mb-2 opacity-30" />
            <p>No payments found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Transaction ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Semester</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map(p => {
                  const sc = STATUS_CFG[p.status] || STATUS_CFG.pending;
                  const Icon = sc.Icon;
                  return (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{p.student?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{p.student?.registrationNumber || p.student?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{p.tranId}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Sem {p.semester}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">BDT {p.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {p.paidAt
                          ? new Date(p.paidAt).toLocaleDateString('en-BD')
                          : new Date(p.createdAt).toLocaleDateString('en-BD')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>
                          <Icon size={11} /> {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
