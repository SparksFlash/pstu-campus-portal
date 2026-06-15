import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { phoneService } from '../../services/phoneService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import {
  FiPhone, FiPlus, FiEdit2, FiTrash2, FiMail, FiSearch,
  FiMapPin, FiUser, FiTag,
} from 'react-icons/fi';

const CATEGORIES = ['Administration', 'Academic', 'Department', 'Emergency'];

const EMPTY_FORM = {
  contactPerson: '',
  designation: '',
  department: '',
  category: '',
  phone: '',
  email: '',
  address: '',
};

const categoryColor = {
  Administration: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Academic:       { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  Department:     { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
  Emergency:      { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
};

function ContactForm({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person <span className="text-red-500">*</span></label>
          <input name="contactPerson" value={form.contactPerson} onChange={onChange} className="input w-full" placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
          <input name="designation" value={form.designation} onChange={onChange} className="input w-full" placeholder="e.g. Registrar" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <input name="department" value={form.department} onChange={onChange} className="input w-full" placeholder="Department name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" value={form.category} onChange={onChange} className="input w-full">
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
          <input name="phone" value={form.phone} onChange={onChange} className="input w-full" placeholder="+880..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} className="input w-full" placeholder="email@pstu.ac.bd" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input name="address" value={form.address} onChange={onChange} className="input w-full" placeholder="Room / Building" />
      </div>
    </div>
  );
}

const PhoneDiary = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = search
        ? await phoneService.searchPhoneEntries(search)
        : await phoneService.getAllPhoneEntries();
      setEntries(Array.isArray(res) ? res : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = entry => {
    setEditing(entry);
    setForm({
      contactPerson: entry.contactPerson || '',
      designation: entry.designation || '',
      department: entry.department || '',
      category: entry.category || '',
      phone: entry.phone || '',
      email: entry.email || '',
      address: entry.address || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.contactPerson.trim()) return toast.error('Contact person name is required');
    if (!form.phone.trim()) return toast.error('Phone number is required');
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) {
        await phoneService.updatePhoneEntry(editing._id, payload);
        toast.success('Contact updated');
      } else {
        await phoneService.createPhoneEntry(payload);
        toast.success('Contact added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await phoneService.deletePhoneEntry(deleteTarget._id);
      toast.success('Contact deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = e => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const filtered = filterCat
    ? entries.filter(e => e.category === filterCat)
    : entries;

  if (loading && entries.length === 0) return <Loading />;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <FiPhone size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Phone Directory</h1>
              <p className="text-sm text-gray-500">{filtered.length} contact{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm self-start"
            >
              <FiPlus size={16} /> Add Contact
            </button>
          )}
        </div>

        {/* Search + Filter row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search contacts…"
                className="input pl-9 w-full"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
            {search && (
              <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }} className="btn-outline">
                Clear
              </button>
            )}
          </form>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="input w-44"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiPhone size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No contacts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(entry => {
              const cat = categoryColor[entry.category] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
              return (
                <div key={entry._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg}`}>
                          <FiUser size={20} className={cat.text} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base leading-tight">{entry.contactPerson}</h3>
                          {entry.designation && (
                            <p className="text-xs text-gray-500 mt-0.5">{entry.designation}</p>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(entry)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {entry.category && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                          <FiTag size={9} className="inline mr-0.5" />{entry.category}
                        </span>
                      )}
                      {entry.department && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{entry.department}</span>
                      )}
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="px-5 pb-4 space-y-2">
                    {entry.address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <FiMapPin size={11} /> {entry.address}
                      </p>
                    )}
                    {entry.email && (
                      <a
                        href={`mailto:${entry.email}`}
                        className="text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-1.5 transition"
                      >
                        <FiMail size={13} className="text-gray-400" /> {entry.email}
                      </a>
                    )}
                  </div>

                  {/* Call button */}
                  <div className="px-5 pb-5">
                    <a
                      href={`tel:${entry.phone}`}
                      onClick={() => window.open(`tel:${entry.phone}`, '_self')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
                    >
                      <FiPhone size={15} /> {entry.phone || 'Call Now'}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Contact' : 'Add Contact'}
        size="lg"
      >
        <ContactForm form={form} onChange={handleChange} />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Contact"
        message={`"${deleteTarget?.contactPerson}" will be permanently removed from the directory.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
};

export default PhoneDiary;
