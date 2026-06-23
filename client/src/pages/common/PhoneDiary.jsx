import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { phoneService } from '../../services/phoneService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { getInitials } from '../../utils/formatters';
import {
  FiPhone, FiPlus, FiEdit2, FiTrash2, FiMail, FiSearch,
  FiMapPin, FiUser, FiChevronRight, FiArrowLeft,
  FiShield, FiBook, FiGrid, FiHome, FiAlertCircle,
  FiMessageCircle, FiMessageSquare, FiX,
} from 'react-icons/fi';

/* ── Category configuration ───────────────────────────────────── */
const CATEGORIES = ['Administration', 'Academic', 'Department', 'Hall', 'Emergency'];

const CAT = {
  Administration: { icon: FiShield,      gradient: 'from-purple-500 to-purple-700', label: 'Administration', bg: 'bg-purple-50', text: 'text-purple-700' },
  Academic:       { icon: FiBook,        gradient: 'from-blue-500 to-blue-700',     label: 'Academic',       bg: 'bg-blue-50',   text: 'text-blue-700'   },
  Department:     { icon: FiGrid,        gradient: 'from-green-500 to-emerald-700', label: 'Departments',    bg: 'bg-green-50',  text: 'text-green-700'  },
  Hall:           { icon: FiHome,        gradient: 'from-amber-500 to-orange-600',  label: 'Halls',          bg: 'bg-amber-50',  text: 'text-amber-700'  },
  Emergency:      { icon: FiAlertCircle, gradient: 'from-red-500 to-red-700',       label: 'Emergency',      bg: 'bg-red-50',    text: 'text-red-700'    },
};
const defaultCat = { icon: FiUser, gradient: 'from-gray-500 to-gray-700', label: 'Other', bg: 'bg-gray-50', text: 'text-gray-700' };

const EMPTY_FORM = { contactPerson: '', designation: '', department: '', category: '', phone: '', email: '', address: '' };

/* ── Contact action buttons ───────────────────────────────────── */
function ActionBtn({ href, icon: Icon, label, color }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${color}`}
    >
      <Icon size={17} />
      {label}
    </a>
  );
}

/* ── Single contact card ──────────────────────────────────────── */
function ContactCard({ entry, catConfig, isAdmin, onEdit, onDelete }) {
  const cfg = catConfig || defaultCat;
  const wa  = entry.phone?.replace(/[^0-9]/g, '');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-5 flex gap-4">
        {/* Avatar */}
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
          <span className="text-white font-black text-lg md:text-xl">
            {getInitials(entry.contactPerson)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{entry.contactPerson}</h3>
              {entry.designation && <p className="text-sm text-gray-500 mt-0.5">{entry.designation}</p>}
            </div>
            {isAdmin && (
              <div className="flex gap-0.5 flex-shrink-0">
                <button onClick={onEdit}   className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition" title="Edit"><FiEdit2 size={13} /></button>
                <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete"><FiTrash2 size={13} /></button>
              </div>
            )}
          </div>

          <div className="mt-2 space-y-1">
            {entry.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <FiPhone size={11} className="text-gray-400 flex-shrink-0" /> {entry.phone}
              </p>
            )}
            {entry.email && (
              <p className="text-sm text-gray-600 flex items-center gap-1.5 truncate">
                <FiMail size={11} className="text-gray-400 flex-shrink-0" /> {entry.email}
              </p>
            )}
            {entry.address && (
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <FiMapPin size={10} className="flex-shrink-0" /> {entry.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {entry.phone && (
        <div className="px-5 pb-5 grid grid-cols-4 gap-2">
          <ActionBtn href={`tel:${entry.phone}`}                                           icon={FiPhone}         label="Call"      color="bg-green-50 text-green-700 hover:bg-green-100" />
          <ActionBtn href={`https://wa.me/${wa}`}                                          icon={FiMessageCircle} label="WhatsApp"  color="bg-emerald-50 text-emerald-700 hover:bg-emerald-100" />
          <ActionBtn href={`sms:${entry.phone}`}                                           icon={FiMessageSquare} label="SMS"       color="bg-blue-50 text-blue-700 hover:bg-blue-100" />
          {entry.email
            ? <ActionBtn href={`mailto:${entry.email}`}                                    icon={FiMail}          label="Email"     color="bg-purple-50 text-purple-700 hover:bg-purple-100" />
            : <div className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-gray-50 text-gray-300 text-xs font-semibold cursor-not-allowed"><FiMail size={17} />Email</div>
          }
        </div>
      )}
    </div>
  );
}

/* ── Add / Edit form ──────────────────────────────────────────── */
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
          <input name="designation" value={form.designation} onChange={onChange} className="input w-full" placeholder="e.g. Vice Chancellor" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
          <select name="category" value={form.category} onChange={onChange} className="input w-full">
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section / Sub-group</label>
          <input name="department" value={form.department} onChange={onChange} className="input w-full" placeholder="e.g. Bijoy 24 Hall, CSE Dept" />
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Address / Room</label>
        <input name="address" value={form.address} onChange={onChange} className="input w-full" placeholder="Room / Building" />
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */
const PhoneDiary = () => {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [entries,        setEntries]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchInput,    setSearchInput]    = useState('');
  const [searchActive,   setSearchActive]   = useState(false);

  // 3-level navigation
  const [view,           setView]           = useState('categories'); // 'categories' | 'departments' | 'contacts'
  const [selectedCat,    setSelectedCat]    = useState(null);
  const [selectedDept,   setSelectedDept]   = useState(null);

  // Admin CRUD
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await phoneService.getAllPhoneEntries();
      setEntries(Array.isArray(res) ? res : []);
    } catch { setEntries([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = entry => {
    setEditing(entry);
    setForm({ contactPerson: entry.contactPerson || '', designation: entry.designation || '', department: entry.department || '', category: entry.category || '', phone: entry.phone || '', email: entry.email || '', address: entry.address || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.contactPerson.trim()) return toast.error('Contact person name is required');
    if (!form.phone.trim())         return toast.error('Phone number is required');
    setSaving(true);
    try {
      if (editing) { await phoneService.updatePhoneEntry(editing._id, form); toast.success('Contact updated'); }
      else         { await phoneService.createPhoneEntry(form);              toast.success('Contact added');   }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err?.message || 'Failed to save'); }
    finally       { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await phoneService.deletePhoneEntry(deleteTarget._id);
      toast.success('Contact deleted');
      setDeleteTarget(null);
      load();
    } catch (err) { toast.error(err?.message || 'Failed to delete'); }
    finally       { setDeleting(false); }
  };

  /* ── Derived data ─────────────────────────────────────────── */
  const searchResults = searchInput.trim()
    ? entries.filter(e =>
        e.contactPerson?.toLowerCase().includes(searchInput.toLowerCase()) ||
        e.designation?.toLowerCase().includes(searchInput.toLowerCase()) ||
        e.department?.toLowerCase().includes(searchInput.toLowerCase()) ||
        e.phone?.includes(searchInput)
      )
    : [];

  const uniqueCategories = [...new Set(entries.map(e => e.category).filter(Boolean))];

  const departmentsInCat = selectedCat
    ? [...new Set(entries.filter(e => e.category === selectedCat).map(e => e.department).filter(Boolean))]
    : [];

  const contactsInView = (selectedCat && selectedDept)
    ? entries.filter(e => e.category === selectedCat && e.department === selectedDept)
    : selectedCat && departmentsInCat.length === 0
      ? entries.filter(e => e.category === selectedCat)
      : [];

  const catCfg = selectedCat ? (CAT[selectedCat] || defaultCat) : null;

  /* ── Breadcrumb nav ───────────────────────────────────────── */
  const goBack = () => {
    if (view === 'contacts')    { setSelectedDept(null); setView('departments'); }
    else if (view === 'departments') { setSelectedCat(null); setView('categories'); }
  };

  const navTitle =
    view === 'categories'   ? 'Phone Directory' :
    view === 'departments'  ? (catCfg?.label || selectedCat) :
    selectedDept || selectedCat;

  if (loading && entries.length === 0) return <Loading />;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {view !== 'categories' && (
              <button
                onClick={goBack}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
              >
                <FiArrowLeft size={18} />
              </button>
            )}
            <div className={`bg-gradient-to-br ${catCfg?.gradient || 'from-indigo-500 to-indigo-700'} p-2.5 rounded-xl shadow-sm`}>
              {React.createElement(catCfg?.icon || FiPhone, { size: 20, className: 'text-white' })}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{navTitle}</h1>
              {view === 'categories' && (
                <p className="text-sm text-gray-500">{entries.length} contacts across {uniqueCategories.length} categories</p>
              )}
              {view === 'departments' && (
                <p className="text-sm text-gray-500">{departmentsInCat.length} section{departmentsInCat.length !== 1 ? 's' : ''}</p>
              )}
              {view === 'contacts' && (
                <p className="text-sm text-gray-500">{contactsInView.length} contact{contactsInView.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          {isAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-indigo-800 transition shadow-sm self-start">
              <FiPlus size={16} /> Add Contact
            </button>
          )}
        </div>

        {/* ── Search bar (always visible) ────────────────────── */}
        <div className="relative">
          <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setSearchActive(!!e.target.value.trim()); }}
            placeholder="Search by name, designation, section, phone…"
            className="input pl-10 pr-10 w-full py-3"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearchActive(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* ── Search results ─────────────────────────────────── */}
        {searchActive && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "<span className="font-medium text-gray-700">{searchInput}</span>"</p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FiSearch size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No contacts found</p>
              </div>
            ) : (
              searchResults.map(e => (
                <ContactCard key={e._id} entry={e} catConfig={CAT[e.category]} isAdmin={isAdmin} onEdit={() => openEdit(e)} onDelete={() => setDeleteTarget(e)} />
              ))
            )}
          </div>
        )}

        {/* ── View 1: Category Grid ──────────────────────────── */}
        {!searchActive && view === 'categories' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uniqueCategories.map(cat => {
              const cfg   = CAT[cat] || defaultCat;
              const count = entries.filter(e => e.category === cat).length;
              const Icon  = cfg.icon;
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCat(cat); setView('departments'); }}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left overflow-hidden"
                >
                  {/* top accent bar */}
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cfg.gradient}`} />
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base md:text-lg">{cfg.label}</h3>
                  <p className="text-xs md:text-sm text-gray-400 mt-0.5">{count} contact{count !== 1 ? 's' : ''}</p>
                  <FiChevronRight size={16} className="absolute bottom-5 right-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        )}

        {/* ── View 2: Department / Section List ─────────────── */}
        {!searchActive && view === 'departments' && (
          <>
            {departmentsInCat.length === 0 ? (
              // No sub-groups — go straight to contacts
              <div className="space-y-4">
                {entries.filter(e => e.category === selectedCat).map(e => (
                  <ContactCard key={e._id} entry={e} catConfig={catCfg} isAdmin={isAdmin} onEdit={() => openEdit(e)} onDelete={() => setDeleteTarget(e)} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {departmentsInCat.map((dept, idx) => {
                  const count = entries.filter(e => e.category === selectedCat && e.department === dept).length;
                  const Icon  = catCfg?.icon || FiUser;
                  return (
                    <button
                      key={dept}
                      onClick={() => { setSelectedDept(dept); setView('contacts'); }}
                      className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition group ${idx < departmentsInCat.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${catCfg?.gradient || 'from-gray-500 to-gray-700'} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={15} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-800">{dept}</p>
                          <p className="text-xs text-gray-400">{count} contact{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <FiChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── View 3: Contacts ──────────────────────────────── */}
        {!searchActive && view === 'contacts' && (
          <div className="space-y-4">
            {contactsInView.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FiUser size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No contacts in this section</p>
              </div>
            ) : (
              contactsInView.map(e => (
                <ContactCard key={e._id} entry={e} catConfig={catCfg} isAdmin={isAdmin} onEdit={() => openEdit(e)} onDelete={() => setDeleteTarget(e)} />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Contact' : 'Add Contact'} size="lg">
        <ContactForm form={form} onChange={handleChange} />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-indigo-800 transition disabled:opacity-50 shadow-sm"
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </Modal>

      {/* ── Delete confirm ────────────────────────────────────── */}
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
