import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { courseService } from '../../services/courseService';
import { facultyService } from '../../services/facultyService';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';
import { FiBook, FiPlus, FiRefreshCw, FiEdit2, FiTrash2 } from 'react-icons/fi';

const EMPTY_FORM = { code: '', title: '', faculty: '', creditHours: 3, semester: '', teacher: '' };

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
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        {initial._id ? 'Edit Course' : 'New Course'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Course Code *</label>
          <input name="code" value={form.code} onChange={set} placeholder="e.g. CSE101" className="input uppercase" />
        </div>
        <div>
          <label className="form-label">Title *</label>
          <input name="title" value={form.title} onChange={set} placeholder="Course title" className="input" />
        </div>
        <div>
          <label className="form-label">Faculty *</label>
          <select name="faculty" value={form.faculty?._id || form.faculty} onChange={set} className="input">
            <option value="">Select Faculty</option>
            {faculties.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Semester *</label>
          <select name="semester" value={form.semester} onChange={set} className="input">
            <option value="">Select Semester</option>
            {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Credit Hours *</label>
          <input name="creditHours" value={form.creditHours} onChange={set} type="number" min={0.5} max={6} step={0.5} className="input" />
        </div>
        <div>
          <label className="form-label">Assign Teacher</label>
          <select name="teacher" value={form.teacher?._id || form.teacher} onChange={set} className="input">
            <option value="">No teacher assigned</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
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

const CourseManagement = () => {
  const [courses, setCourses]     = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editing, setEditing]     = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, f] = await Promise.all([courseService.getAllCourses(), facultyService.getAllFaculties()]);
      setCourses(c || []);
      setFaculties(f || []);
    } catch (err) {
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
        toast.success('Course updated successfully');
      } else {
        await courseService.createCourse(data);
        toast.success('Course created successfully');
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

  // Group by faculty → semester
  const grouped = courses.reduce((acc, c) => {
    const fac = c.faculty?._id || c.faculty || 'unassigned';
    const facName = c.faculty?.name || 'Unassigned';
    const sem = c.semester || '?';
    if (!acc[fac]) acc[fac] = { name: facName, semesters: {} };
    if (!acc[fac].semesters[sem]) acc[fac].semesters[sem] = [];
    acc[fac].semesters[sem].push(c);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <FiBook size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
              <p className="text-sm text-gray-500">Manage courses grouped by faculty and semester</p>
            </div>
          </div>
          <div className="flex gap-2 self-start">
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
              <FiPlus size={15} /> New Course
            </button>
            <button onClick={load} className="btn-outline flex items-center gap-2">
              <FiRefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <CourseForm
            initial={editing || {}}
            faculties={faculties}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            saving={saving}
          />
        )}

        {/* Course list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div key={j} className="h-10 bg-gray-100 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
            No courses yet. Click "New Course" to add one.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([facId, { name: facName, semesters }]) => (
              <div key={facId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-800">{facName}</h2>
                  <span className="text-xs text-gray-400">
                    {Object.values(semesters).flat().length} courses
                  </span>
                </div>
                {Object.entries(semesters)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([sem, items]) => (
                    <div key={sem} className="border-b border-gray-50 last:border-0">
                      <div className="px-6 py-2 bg-gray-50">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Semester {sem} &nbsp;·&nbsp; {items.length} course{items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-50">
                          {items.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-3 w-28">
                                <span className="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                  {c.code}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{c.creditHours} cr</td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{c.teacher?.name || 'No teacher'}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => { setEditing(c); setShowForm(true); }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                                    title="Edit"
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(c)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
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
                  ))}
              </div>
            ))}
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
