import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { facultyService } from '../../services/facultyService';
import { toast } from 'react-toastify';
import { FiGrid, FiPlus, FiRefreshCw, FiEdit2, FiTrash2 } from 'react-icons/fi';

const EMPTY_FORM = { name: '', code: '', description: '' };

const FacultyForm = ({ initial = {}, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        {initial._id ? 'Edit Faculty' : 'New Faculty'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Faculty Name *</label>
          <input name="name" value={form.name} onChange={set} placeholder="e.g. Computer Science & Engineering" className="input" />
        </div>
        <div>
          <label className="form-label">Code *</label>
          <input name="code" value={form.code} onChange={set} placeholder="e.g. CSE" className="input uppercase" />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Description</label>
          <textarea name="description" value={form.description} onChange={set} placeholder="Brief description…" rows={3} className="input resize-none" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn-primary" onClick={() => onSave(form)} disabled={saving || !form.name || !form.code}>
          {saving ? 'Saving…' : 'Save Faculty'}
        </button>
        <button className="btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
};

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editing, setEditing]     = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { _id, name }

  const load = async () => {
    setLoading(true);
    try {
      const f = await facultyService.getAllFaculties();
      setFaculties(f || []);
    } catch (err) {
      toast.error('Failed to load faculties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => { setEditing(null); setShowForm(true); };
  const handleEdit   = (f) => { setEditing(f); setShowForm(true); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await facultyService.updateFaculty(editing._id, data);
        toast.success('Faculty updated successfully');
      } else {
        await facultyService.createFaculty(data);
        toast.success('Faculty created successfully');
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err?.message || 'Failed to save faculty');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await facultyService.deleteFaculty(deleteTarget._id);
      toast.success('Faculty deleted');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete faculty');
      setDeleteTarget(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <FiGrid size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
              <p className="text-sm text-gray-500">Create and manage university faculties</p>
            </div>
          </div>
          <div className="flex gap-2 self-start">
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <FiPlus size={15} /> New Faculty
            </button>
            <button onClick={load} className="btn-outline flex items-center gap-2">
              <FiRefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <FacultyForm
            initial={editing || {}}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            saving={saving}
          />
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[1, 2, 3, 4].map((j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded w-28" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : faculties.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                      No faculties yet. Click "New Faculty" to add one.
                    </td>
                  </tr>
                ) : (
                  faculties.map((f) => (
                    <tr key={f._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                      <td className="px-4 py-3">
                        <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded">
                          {f.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{f.description || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(f)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition"
                            title="Edit"
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(f)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Faculty"
        message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
};

export default FacultyManagement;
