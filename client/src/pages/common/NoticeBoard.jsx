import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import { noticeService } from '../../services/noticeService';
import { facultyService } from '../../services/facultyService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import {
  FiBell, FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar,
} from 'react-icons/fi';

const EMPTY_FORM = {
  title: '', content: '', faculty: '', expiryDate: '',
};

function NoticeForm({ form, onChange, faculties }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          className="input w-full"
          placeholder="Notice title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
        <textarea
          name="content"
          value={form.content}
          onChange={onChange}
          rows={5}
          className="input w-full resize-none"
          placeholder="Notice content..."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Faculty <span className="text-gray-400 font-normal">(optional)</span></label>
          <select name="faculty" value={form.faculty} onChange={onChange} className="input w-full">
            <option value="">All faculties</option>
            {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            name="expiryDate"
            type="date"
            value={form.expiryDate}
            onChange={onChange}
            className="input w-full"
          />
        </div>
      </div>
    </div>
  );
}

const NoticeBoard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [faculties, setFaculties] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, obj = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = search
        ? await noticeService.searchNotices(search)
        : await noticeService.getAllNotices();
      setNotices(Array.isArray(res) ? res : []);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    facultyService.getAllFaculties()
      .then(f => setFaculties(Array.isArray(f) ? f : []))
      .catch(() => {});
  }, [isAdmin]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (notice) => {
    setEditing(notice);
    setForm({
      title: notice.title || '',
      content: notice.content || '',
      faculty: notice.faculty?._id || notice.faculty || '',
      expiryDate: notice.expiryDate ? notice.expiryDate.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.content.trim()) return toast.error('Content is required');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        faculty: form.faculty || undefined,
        expiryDate: form.expiryDate || undefined,
      };
      if (editing) {
        await noticeService.updateNotice(editing._id, payload);
        toast.success('Notice updated');
      } else {
        await noticeService.createNotice(payload);
        toast.success('Notice created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to save notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await noticeService.deleteNotice(deleteTarget._id);
      toast.success('Notice deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete notice');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = e => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const isExpired = (n) => n.expiryDate && new Date(n.expiryDate) < new Date();

  if (loading && notices.length === 0) return <Loading />;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2.5 rounded-xl">
              <FiBell size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notice Board</h1>
              <p className="text-sm text-gray-500">{notices.length} notice{notices.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-sm self-start"
            >
              <FiPlus size={16} /> New Notice
            </button>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search notices…"
              className="input pl-9 w-full"
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); }}
              className="btn-outline"
            >
              Clear
            </button>
          )}
        </form>

        {/* Notice list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse border border-gray-100">
                <div className="h-5 bg-gray-100 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                <div className="h-16 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiBell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notices found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map(notice => (
              <div
                key={notice._id}
                className={`bg-white rounded-xl shadow-sm border-l-4 hover:shadow-md transition overflow-hidden ${
                  isExpired(notice)
                    ? 'border-gray-300 opacity-60'
                    : notice.faculty
                    ? 'border-blue-400'
                    : 'border-primary-500'
                }`}
              >
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{notice.title}</h3>
                        {notice.faculty?.name && (
                          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {notice.faculty.name}
                          </span>
                        )}
                        {isExpired(notice) && (
                          <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>By {notice.createdBy?.name || 'Admin'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <FiCalendar size={11} />
                          {formatDate(notice.createdAt)}
                        </span>
                        {notice.expiryDate && !isExpired(notice) && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600">Expires {formatDate(notice.expiryDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(notice)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                          title="Edit"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(notice)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {notice.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Notice' : 'New Notice'}
        size="lg"
      >
        <NoticeForm form={form} onChange={handleChange} faculties={faculties} />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Notice'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Notice"
        message={`"${deleteTarget?.title}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
};

export default NoticeBoard;
