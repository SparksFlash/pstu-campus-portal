import React, { useState, useCallback, useEffect } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { toast } from 'react-toastify';
import teacherService from '../../services/teacherService';
import { FiCheckSquare, FiSlash, FiRefreshCw, FiUsers } from 'react-icons/fi';

export default function ResultPublish() {
  const [semester, setSemester]   = useState(1);
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState(false);
  const [confirm, setConfirm]     = useState(null); // { action: 'publish'|'unpublish' }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teacherService.getSemesterPublishStatus(semester);
      setStatus(data);
    } catch (err) {
      toast.error('Failed to load publish status');
    } finally {
      setLoading(false);
    }
  }, [semester]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const fn = confirm.action === 'publish'
        ? teacherService.publishSemesterResults
        : teacherService.unpublishSemesterResults;
      const res = await fn(semester);
      toast.success(res.message);
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err?.message || 'Action failed');
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const allPublished = status && status.total > 0 && status.draft === 0;
  const nonePublished = status && status.published === 0;
  const publishPct = status?.total ? Math.round((status.published / status.total) * 100) : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <FiCheckSquare size={20} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Publish Results</h1>
              <p className="text-sm text-gray-500">Control which semester results are visible to students</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Semester:</label>
            <select
              value={semester}
              onChange={(e) => setSemester(parseInt(e.target.value))}
              className="input w-36"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            <button onClick={load} className="btn-outline flex items-center gap-1.5">
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Status summary card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-32" />
            </div>
          ) : !status || status.total === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FiUsers size={36} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No grades found for Semester {semester}</p>
              <p className="text-sm mt-1">Enter marks first via Marks Management.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Publishing progress — Semester {semester}</span>
                  <span className="text-gray-500">{status.published} / {status.total} published ({publishPct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${publishPct}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Published: {status.published}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" /> Draft: {status.draft}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-300" /> Total: {status.total}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirm({ action: 'publish' })}
                  disabled={allPublished || busy}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <FiCheckSquare size={15} />
                  {allPublished ? 'All Published' : `Publish All (${status.draft} drafts)`}
                </button>
                <button
                  onClick={() => setConfirm({ action: 'unpublish' })}
                  disabled={nonePublished || busy}
                  className="btn-outline flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSlash size={15} />
                  Unpublish All ({status.published})
                </button>
              </div>

              {allPublished && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ All results for Semester {semester} are published and visible to students.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Per-student breakdown */}
        {!loading && status && status.students?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Per-Student Status</h2>
              <span className="text-xs text-gray-400">{status.students.length} students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Student</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Registration</th>
                    <th className="px-5 py-3 text-center font-medium text-gray-600">Grades</th>
                    <th className="px-5 py-3 text-center font-medium text-gray-600">Published</th>
                    <th className="px-5 py-3 text-center font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {status.students.map((s) => {
                    const done = s.gradesCount > 0 && s.publishedCount === s.gradesCount;
                    const partial = s.publishedCount > 0 && !done;
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                        <td className="px-5 py-3 text-gray-500">{s.registrationNumber || '—'}</td>
                        <td className="px-5 py-3 text-center text-gray-600">{s.gradesCount}</td>
                        <td className="px-5 py-3 text-center text-gray-600">{s.publishedCount}</td>
                        <td className="px-5 py-3 text-center">
                          {s.gradesCount === 0 ? (
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">No marks</span>
                          ) : done ? (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Published</span>
                          ) : partial ? (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Partial</span>
                          ) : (
                            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Draft</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'publish' ? 'Publish All Results' : 'Unpublish All Results'}
        message={
          confirm?.action === 'publish'
            ? `All ${status?.draft || 0} draft grade(s) for Semester ${semester} will become visible to students immediately.`
            : `All ${status?.published || 0} published grade(s) for Semester ${semester} will be hidden from students.`
        }
        confirmLabel={confirm?.action === 'publish' ? 'Publish' : 'Unpublish'}
        variant={confirm?.action === 'publish' ? 'primary' : 'danger'}
        onConfirm={handleAction}
        onCancel={() => setConfirm(null)}
      />
    </Layout>
  );
}
