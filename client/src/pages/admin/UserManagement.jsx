import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { adminService } from '../../services/adminService';
import { toast } from 'react-toastify';
import { FiUsers, FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw, FiEdit2, FiX, FiCheck } from 'react-icons/fi';

const roleBadge = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: '2-digit' });
}

const RowSkeleton = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded w-24" />
      </td>
    ))}
  </tr>
);

// Inline edit modal for semester
const EditSemesterModal = ({ user, onSave, onClose }) => {
  const [semester, setSemester] = useState(user.semester || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user._id, semester);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Edit Semester — {user.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
        </div>
        <select
          value={semester}
          onChange={e => setSemester(e.target.value)}
          className="input w-full mb-4"
        >
          <option value="">— Not assigned —</option>
          {[1,2,3,4,5,6,7,8].map(s => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-1">
            <FiCheck size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers]             = useState([]);
  const [pagination, setPagination]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [roleFilter, setRoleFilter]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [confirm, setConfirm]         = useState(null);
  const [editUser, setEditUser]       = useState(null); // user being edited

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers({ page, limit: 15, role: roleFilter, q: search });
      setUsers(res.data || []);
      setPagination(res.pagination || null);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleToggleActive = async () => {
    if (!confirm) return;
    try {
      const res = await adminService.toggleUserActive(confirm.userId);
      toast.success(res.message);
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Action failed');
      setConfirm(null);
    }
  };

  const handleUpdateSemester = async (userId, semester) => {
    try {
      await adminService.updateUser(userId, { semester: semester === '' ? null : parseInt(semester) });
      toast.success('Semester updated');
      load();
    } catch (err) {
      toast.error(err?.message || 'Update failed');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <FiUsers size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-500">Manage all system users</p>
            </div>
          </div>
          <button onClick={load} className="btn-outline flex items-center gap-2 self-start">
            <FiRefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email or ID…"
                className="input pl-9"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Faculty</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Semester</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
                  : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  )
                  : users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary-600">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.registrationNumber || u.employeeId || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[u.role] || ''}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.faculty?.name || '—'}</td>
                      <td className="px-4 py-3">
                        {u.role === 'student' ? (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.semester ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                              {u.semester ? `Sem ${u.semester}` : 'Not set'}
                            </span>
                            <button
                              onClick={() => setEditUser(u)}
                              className="text-gray-400 hover:text-primary-600 transition"
                              title="Edit semester"
                            >
                              <FiEdit2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive
                          ? <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                          : <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>
                        }
                        {!u.isVerified && (
                          <span className="ml-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Unverified</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirm({ userId: u._id, name: u.name, isActive: u.isActive })}
                          className={`text-xs font-medium px-3 py-1 rounded-lg border transition ${
                            u.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages} &nbsp;·&nbsp; {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <FiChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm deactivate/activate */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.isActive ? 'Deactivate User' : 'Activate User'}
        message={
          confirm?.isActive
            ? `${confirm?.name} will lose access to the system immediately.`
            : `${confirm?.name} will regain access to the system.`
        }
        confirmLabel={confirm?.isActive ? 'Deactivate' : 'Activate'}
        variant={confirm?.isActive ? 'danger' : 'primary'}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirm(null)}
      />

      {/* Edit semester modal */}
      {editUser && (
        <EditSemesterModal
          user={editUser}
          onSave={handleUpdateSemester}
          onClose={() => setEditUser(null)}
        />
      )}
    </Layout>
  );
};

export default UserManagement;
