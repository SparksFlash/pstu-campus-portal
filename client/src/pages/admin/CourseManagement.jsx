import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { courseService } from '../../services/courseService';
import { facultyService } from '../../services/facultyService';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';
import {
import { semesterLabel } from '../../utils/formatters';
  FiBook, FiPlus, FiRefreshCw, FiEdit2, FiTrash2,
  FiChevronDown, FiChevronRight, FiSearch, FiX,
} from 'react-icons/fi';

const EMPTY_FORM = { code: '', title: '', faculty: '', creditHours: 3, semester: '', teacher: '' };

/* ── Initials avatar ─────────────────────────────────────────────── */
function Initials({ name, size = 'sm' }) {
  const letters = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold flex-shrink-0 ${sz}`}>
      {letters}
    </span>
  );
}

/* ── Course form ─────────────────────────────────────────────────── */
const CourseForm = ({ initial = {}, faculties = [], onSave, onCancel, saving }) => {
  const [form, setForm]       = useState({ ...EMPTY_FORM, ...initial });
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    let mounted = true;
    userService.getByRole('teacher').then((res) => { if (mounted) setTeachers(res || []); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
        {initial._id ? 'Edit Course' : 'New Course'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Course Code <span className="text-red-400">*</span></label>
          <input name="code" value={form.code} onChange={set} placeholder="e.g. CSE101"
            className="input uppercase tracking-wider" />
        </div>
        <div>
          <label className="form-label">Title <span className="text-red-400">*</span></label>
          <input name="title" value={form.title} onChange={set} placeholder="Course title" className="input" />
        </div>
        <div>
          <label className="form-label">Faculty <span className="text-red-400">*</span></label>
          <select name="faculty" value={form.faculty?._id || form.faculty} onChange={set} className="input">
            <option value="">Select faculty…</option>
            {faculties.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Semester <span className="text-red-400">*</span></label>
          <select name="semester" value={form.semester} onChange={set} className="input">
            <option value="">Select semester…</option>
            {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>{semesterLabel(s)}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Credit Hours <span className="text-red-400">*</span></label>
          <input name="creditHours" value={form.creditHours} onChange={set}
            type="number" min={0.5} max={6} step={0.5} className="input" />
        </div>
        <div>
          <label className="form-label">Assign Teacher</label>
          <select name="teacher" value={form.teacher?._id || form.teacher} onChange={set} className="input">
            <option value="">No teacher assigned</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          className="btn-primary"
          onClick={() => onSave({ ...form, faculty: form.faculty?._id || form.faculty, teacher: form.teacher?._id || form.teacher || undefined })}
          disabled={saving || !form.code || !form.title || !form.faculty || !form.semester}
        >
          {saving ? 'Saving…' : 'Save Course'}
        </button>
        <button className="btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────── */
const CourseManagement = () => {
  const [courses, setCourses]       = useState([]);
  const [faculties, setFaculties]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editing, setEditing]       = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch]         = useState('');
  const [collapsed, setCollapsed]   = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [c, f] = await Promise.all([courseService.getAllCourses(), facultyService.getAllFaculties()]);
      setCourses(c || []);
      setFaculties(f || []);
    } catch {
      toast.error('Failed to load courses or faculties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await courseService.updateCourse(editing._id, data);
        toast.success('Course updated');
      } else {
        await courseService.createCourse(data);
        toast.success('Course created');
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await courseService.deleteCourse(deleteTarget._id);
      toast.success('Course deleted');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete course');
      setDeleteTarget(null);
    }
  };

  const toggleCollapse = (facId) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(facId) ? next.delete(facId) : next.add(facId);
      return next;
    });
  };

  /* Client-side search filter */
  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(c =>
      c.code?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q)
    );
  }, [courses, search]);

  /* Group by faculty → semester */
  const grouped = useMemo(() => filtered.reduce((acc, c) => {
    const fac     = c.faculty?._id || c.faculty || 'unassigned';
    const facName = c.faculty?.name || 'Unassigned';
    const sem     = c.semester || '?';
    if (!acc[fac]) acc[fac] = { name: facName, semesters: {} };
    if (!acc[fac].semesters[sem]) acc[fac].semesters[sem] = [];
    acc[fac].semesters[sem].push(c);
    return acc;
  }, {}), [filtered]);

  const totalCourses = courses.length;
  const totalFaculties = Object.keys(grouped).length;

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl">
              <FiBook size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalFaculties} facult{totalFaculties === 1 ? 'y' : 'ies'} · {totalCourses} courses
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-start">
            <button onClick={() => { setEditing(null); setShowForm(true); }}
              className="btn-primary flex items-center gap-2">
              <FiPlus size={15} /> New Course
            </button>
            <button onClick={load} className="btn-outline flex items-center gap-2">
              <FiRefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Course form ─────────────────────────────────────────── */}
        {showForm && (
          <CourseForm
            initial={editing || {}}
            faculties={faculties}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            saving={saving}
          />
        )}

        {/* ── Search bar ──────────────────────────────────────────── */}
        {!loading && courses.length > 0 && (
          <div className="relative max-w-sm">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or title…"
              className="input pl-9 pr-8"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div key={j} className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>

        ) : courses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-14 text-center border border-gray-100 dark:border-gray-700">
            <FiBook size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium text-gray-500 dark:text-gray-400">No courses yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "New Course" to add the first one.</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No courses match "<strong>{search}</strong>".</p>
          </div>

        ) : (
          /* ── Faculty cards ──────────────────────────────────────── */
          <div className="space-y-4">
            {Object.entries(grouped).map(([facId, { name: facName, semesters }]) => {
              const isOpen        = !collapsed.has(facId);
              const totalInFac    = Object.values(semesters).flat().length;
              const totalCrInFac  = Object.values(semesters).flat()
                .reduce((s, c) => s + (parseFloat(c.creditHours) || 0), 0);

              return (
                <div key={facId}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

                  {/* Faculty header */}
                  <button
                    onClick={() => toggleCollapse(facId)}
                    className="w-full flex items-center justify-between px-5 py-4
                      border-b border-gray-100 dark:border-gray-700
                      hover:bg-gray-50 dark:hover:bg-gray-700/40 transition
                      border-l-4 border-l-primary-500"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen
                        ? <FiChevronDown size={16} className="text-gray-400" />
                        : <FiChevronRight size={16} className="text-gray-400" />
                      }
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                        {facName}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {totalInFac} course{totalInFac !== 1 ? 's' : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        {totalCrInFac} cr total
                      </span>
                    </div>
                  </button>

                  {/* Semester sections */}
                  {isOpen && Object.entries(semesters)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([sem, items]) => {
                      const semCredits = items.reduce((s, c) => s + (parseFloat(c.creditHours) || 0), 0);
                      return (
                        <div key={sem} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">

                          {/* Semester sub-header */}
                          <div className="flex items-center gap-3 px-6 py-2 bg-gray-50/80 dark:bg-gray-700/20">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              {semesterLabel(sem)}
                            </span>
                            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {items.length} course{items.length !== 1 ? 's' : ''} · {semCredits} cr
                            </span>
                          </div>

                          {/* Course rows */}
                          <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                              {items.map((c) => (
                                <tr key={c._id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition group">
                                  {/* Code badge */}
                                  <td className="px-6 py-3 w-32">
                                    <span className="font-mono text-xs font-bold text-primary-700 dark:text-primary-400
                                      bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-md tracking-wider">
                                      {c.code}
                                    </span>
                                  </td>
                                  {/* Title */}
                                  <td className="px-3 py-3 font-medium text-gray-800 dark:text-gray-200">
                                    {c.title}
                                  </td>
                                  {/* Credit hours */}
                                  <td className="px-3 py-3 w-20">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full
                                      bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                      {c.creditHours} cr
                                    </span>
                                  </td>
                                  {/* Teacher */}
                                  <td className="px-3 py-3 w-44">
                                    {c.teacher?.name ? (
                                      <div className="flex items-center gap-2">
                                        <Initials name={c.teacher.name} />
                                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                                          {c.teacher.name}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-300 dark:text-gray-600">Unassigned</span>
                                    )}
                                  </td>
                                  {/* Actions */}
                                  <td className="px-4 py-3 w-20">
                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
                                      <button
                                        onClick={() => { setEditing(c); setShowForm(true); }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition"
                                        title="Edit"
                                      >
                                        <FiEdit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => setDeleteTarget(c)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                        title="Delete"
                                      >
                                        <FiTrash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Course"
        message={`"${deleteTarget?.code} — ${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
};

export default CourseManagement;
