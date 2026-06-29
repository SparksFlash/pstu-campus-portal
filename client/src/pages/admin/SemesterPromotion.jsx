import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { adminService } from '../../services/adminService';
import { facultyService } from '../../services/facultyService';
import { toast } from 'react-toastify';
import { semesterLabel } from '../../utils/formatters';
import {
  FiArrowUpCircle, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiSearch, FiUsers, FiLoader,
} from 'react-icons/fi';

export default function SemesterPromotion() {
  const [faculties, setFaculties]   = useState([]);
  const [faculty, setFaculty]       = useState('');
  const [semester, setSemester]     = useState('');
  const [preview, setPreview]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [promoting, setPromoting]   = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    facultyService.getAllFaculties()
      .then(f => setFaculties(f || []))
      .catch(() => {});
  }, []);

  const handlePreview = async () => {
    if (!faculty || !semester) {
      toast.error('Select a faculty and semester first');
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const data = await adminService.getPromotionPreview(faculty, semester);
      setPreview(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    setConfirmOpen(false);
    setPromoting(true);
    try {
      const res = await adminService.promoteSemester({ faculty, semester: parseInt(semester) });
      toast.success(res.message || `${res.promoted} students promoted`);
      // Refresh preview to show new state
      const updated = await adminService.getPromotionPreview(faculty, semester);
      setPreview(updated);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  const facName = faculties.find(f => f._id === faculty)?.name || '';

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl">
            <FiArrowUpCircle size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Semester Promotion</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Promote eligible students from one semester to the next after results are published
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="form-label">Faculty</label>
              <select value={faculty} onChange={e => { setFaculty(e.target.value); setPreview(null); }} className="input">
                <option value="">Select faculty…</option>
                {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div className="w-48">
              <label className="form-label">From Semester</label>
              <select value={semester} onChange={e => { setSemester(e.target.value); setPreview(null); }} className="input">
                <option value="">Select…</option>
                {[1,2,3,4,5,6,7].map(s => <option key={s} value={s}>{semesterLabel(s)} → {semesterLabel(s+1)}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handlePreview}
                disabled={loading || !faculty || !semester}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                {loading
                  ? <><FiLoader className="animate-spin" size={15} /> Checking…</>
                  : <><FiSearch size={15} /> Preview</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Preview results */}
        {preview && (
          <>
            {/* Summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {preview.eligible.length + preview.blocked.length}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">students in {semesterLabel(preview.semester)}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-1">Eligible</p>
                <p className="text-2xl font-black text-green-700 dark:text-green-400">{preview.eligible.length}</p>
                <p className="text-xs text-green-500 dark:text-green-500 mt-0.5">ready to promote</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-1">Blocked</p>
                <p className="text-2xl font-black text-red-700 dark:text-red-400">{preview.blocked.length}</p>
                <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">failed or dues pending</p>
              </div>
            </div>

            {/* Promote button */}
            {preview.eligible.length > 0 && (
              <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-xl px-5 py-4">
                <div>
                  <p className="font-semibold text-primary-800 dark:text-primary-300 text-sm">
                    Promote {preview.eligible.length} eligible student{preview.eligible.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                    {facName} · {semesterLabel(preview.semester)} → {semesterLabel(preview.semester + 1)}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={promoting}
                  className="btn-primary flex items-center gap-2"
                >
                  {promoting
                    ? <><FiLoader className="animate-spin" size={15} /> Promoting…</>
                    : <><FiArrowUpCircle size={15} /> Promote All Eligible</>
                  }
                </button>
              </div>
            )}

            {/* Eligible table */}
            {preview.eligible.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/10">
                  <FiCheckCircle size={15} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Eligible for Promotion ({preview.eligible.length})
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Reg No</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {preview.eligible.map(s => (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition">
                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{s.name}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{s.registrationNumber || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">{s.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <FiCheckCircle size={10} /> Ready
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Blocked table */}
            {preview.blocked.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
                  <FiXCircle size={15} className="text-red-500 dark:text-red-400" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Blocked — Cannot Promote ({preview.blocked.length})
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Reg No</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason(s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {preview.blocked.map(s => (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition">
                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{s.name}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{s.registrationNumber || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {s.reasons.map((r, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                <FiAlertTriangle size={10} /> {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* All blocked, nothing to do */}
            {preview.eligible.length === 0 && preview.blocked.length === 0 && (
              <div className="text-center py-14 text-gray-400 dark:text-gray-500">
                <FiUsers size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No students found in {semesterLabel(preview.semester)} for this faculty.</p>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Promotion"
        message={`Promote ${preview?.eligible?.length ?? 0} student${preview?.eligible?.length !== 1 ? 's' : ''} from ${semesterLabel(semester)} → ${semesterLabel(parseInt(semester) + 1)} in ${facName}? This cannot be undone.`}
        confirmLabel="Promote"
        variant="primary"
        onConfirm={handlePromote}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
}
