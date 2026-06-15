import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { busService } from '../../services/busService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import {
  FiTruck, FiPlus, FiEdit2, FiTrash2, FiPhone, FiMapPin,
  FiClock, FiUsers,
} from 'react-icons/fi';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPTY_FORM = {
  busNumber: '',
  routeName: '',
  driver: '',
  phone: '',
  capacity: '',
  daysOfOperation: [],
  pickupPoints: [{ location: '', time: '' }],
  dropPoints: [{ location: '', time: '' }],
};

function PointsEditor({ label, points, onChange }) {
  const update = (i, field, val) => {
    const next = points.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    onChange(next);
  };
  const add = () => onChange([...points, { location: '', time: '' }]);
  const remove = i => onChange(points.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button type="button" onClick={add} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
          <FiPlus size={12} /> Add stop
        </button>
      </div>
      <div className="space-y-2">
        {points.map((p, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={p.location}
              onChange={e => update(i, 'location', e.target.value)}
              placeholder="Location"
              className="input flex-1 text-sm"
            />
            <input
              value={p.time}
              onChange={e => update(i, 'time', e.target.value)}
              placeholder="Time"
              className="input w-28 text-sm"
            />
            {points.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 transition p-1">
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BusForm({ form, setForm }) {
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const toggleDay = (day) => {
    setForm(p => ({
      ...p,
      daysOfOperation: p.daysOfOperation.includes(day)
        ? p.daysOfOperation.filter(d => d !== day)
        : [...p.daysOfOperation, day],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number <span className="text-red-500">*</span></label>
          <input name="busNumber" value={form.busNumber} onChange={handleChange} className="input w-full" placeholder="e.g. PSTU-01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
          <input name="routeName" value={form.routeName} onChange={handleChange} className="input w-full" placeholder="e.g. Campus → City" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
          <input name="driver" value={form.driver} onChange={handleChange} className="input w-full" placeholder="Driver's name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="input w-full" placeholder="+880..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
          <input name="capacity" type="number" value={form.capacity} onChange={handleChange} className="input w-full" placeholder="Seats" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Days of Operation</label>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                form.daysOfOperation.includes(day)
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <PointsEditor
        label="Pickup Points"
        points={form.pickupPoints}
        onChange={pts => setForm(p => ({ ...p, pickupPoints: pts }))}
      />
      <PointsEditor
        label="Drop Points"
        points={form.dropPoints}
        onChange={pts => setForm(p => ({ ...p, dropPoints: pts }))}
      />
    </div>
  );
}

const dayAbbr = days => {
  if (!days || days.length === 0) return '—';
  if (days.length === 7) return 'Daily';
  if (days.length >= 5 && days.includes('Saturday') && days.includes('Sunday')) return 'Weekdays';
  return days.map(d => d.slice(0, 3)).join(', ');
};

const BusSchedule = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await busService.getAllBusSchedules();
      setBuses(Array.isArray(res) ? res : []);
    } catch {
      setBuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = bus => {
    setEditing(bus);
    setForm({
      busNumber: bus.busNumber || '',
      routeName: bus.routeName || '',
      driver: bus.driver || '',
      phone: bus.phone || '',
      capacity: bus.capacity || '',
      daysOfOperation: bus.daysOfOperation || [],
      pickupPoints: bus.pickupPoints?.length ? bus.pickupPoints : [{ location: '', time: '' }],
      dropPoints: bus.dropPoints?.length ? bus.dropPoints : [{ location: '', time: '' }],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.busNumber.trim()) return toast.error('Bus number is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        pickupPoints: form.pickupPoints.filter(p => p.location),
        dropPoints: form.dropPoints.filter(p => p.location),
      };
      if (editing) {
        await busService.updateBusSchedule(editing._id, payload);
        toast.success('Bus schedule updated');
      } else {
        await busService.createBusSchedule(payload);
        toast.success('Bus schedule added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await busService.deleteBusSchedule(deleteTarget._id);
      toast.success('Bus schedule deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && buses.length === 0) return <Loading />;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2.5 rounded-xl">
              <FiTruck size={20} className="text-green-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bus Schedule</h1>
              <p className="text-sm text-gray-500">{buses.length} route{buses.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition shadow-sm self-start"
            >
              <FiPlus size={16} /> Add Route
            </button>
          )}
        </div>

        {/* Bus cards */}
        {buses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiTruck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bus routes added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {buses.map(bus => (
              <div key={bus._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                {/* Card header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <FiTruck size={18} />
                      </div>
                      <div>
                        <span className="text-lg font-bold">{bus.busNumber}</span>
                        {bus.routeName && (
                          <p className="text-green-100 text-xs mt-0.5">{bus.routeName}</p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(bus)}
                          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                          title="Edit"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(bus)}
                          className="p-1.5 rounded-lg text-white/70 hover:text-red-200 hover:bg-white/10 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-3">
                  {/* Meta row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    {bus.driver && (
                      <span className="flex items-center gap-1">
                        <FiUsers size={13} className="text-gray-400" /> {bus.driver}
                      </span>
                    )}
                    {bus.phone && (
                      <a href={`tel:${bus.phone}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <FiPhone size={13} /> {bus.phone}
                      </a>
                    )}
                    {bus.capacity && (
                      <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {bus.capacity} seats
                      </span>
                    )}
                  </div>

                  {/* Days */}
                  <div className="text-xs text-gray-500 bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-lg font-medium">
                    {dayAbbr(bus.daysOfOperation)}
                  </div>

                  {/* Pickup stops */}
                  {bus.pickupPoints?.filter(p => p.location).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pickup Stops</p>
                      <div className="space-y-1">
                        {bus.pickupPoints.filter(p => p.location).map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-gray-700">
                              <FiMapPin size={11} className="text-green-500 flex-shrink-0" /> {p.location}
                            </span>
                            {p.time && (
                              <span className="flex items-center gap-1 text-gray-400 text-xs">
                                <FiClock size={10} /> {p.time}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drop stops */}
                  {bus.dropPoints?.filter(p => p.location).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Drop Points</p>
                      <div className="space-y-1">
                        {bus.dropPoints.filter(p => p.location).map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-gray-700">
                              <FiMapPin size={11} className="text-red-400 flex-shrink-0" /> {p.location}
                            </span>
                            {p.time && (
                              <span className="flex items-center gap-1 text-gray-400 text-xs">
                                <FiClock size={10} /> {p.time}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Bus — ${editing.busNumber}` : 'Add Bus Route'}
        size="xl"
      >
        <BusForm form={form} setForm={setForm} />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Route'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Bus Route"
        message={`Bus ${deleteTarget?.busNumber} will be permanently deleted.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
};

export default BusSchedule;
