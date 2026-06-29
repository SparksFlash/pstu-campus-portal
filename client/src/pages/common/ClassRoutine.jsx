import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { classRoutineService } from '../../services/classRoutineService';
import { facultyService } from '../../services/facultyService';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { semesterLabel } from '../../utils/formatters';
import {
  FiCalendar, FiEdit3, FiPlus, FiTrash2, FiCheck,
} from 'react-icons/fi';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const TIME_SLOTS = [
  { slot: '09:00-10:00', label: '9:00', end: '10:00' },
  { slot: '10:00-11:00', label: '10:00', end: '11:00' },
  { slot: '11:00-12:00', label: '11:00', end: '12:00' },
  { slot: '12:00-13:00', label: '12:00', end: '1:00' },
  { slot: '14:00-15:00', label: '2:00', end: '3:00' },
  { slot: '15:00-16:00', label: '3:00', end: '4:00' },
  { slot: '16:00-17:00', label: '4:00', end: '5:00' },
];

const EMPTY_ENTRY = { courseCode: '', courseTitle: '', course: '', teacherName: '', teacher: '', room: '' };

const todayName = () => {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[new Date().getDay()];
};

function CellModal({ open, onClose, entry, courses, onSave, onClear, saving }) {
  const [form, setForm] = useState(EMPTY_ENTRY);

  useEffect(() => {
    if (open) {
      setForm(entry
        ? { courseCode: entry.courseCode || '', courseTitle: entry.courseTitle || '', course: entry.course || '', teacherName: entry.teacherName || '', teacher: entry.teacher || '', room: entry.room || '' }
        : EMPTY_ENTRY
      );
    }
  }, [open, entry]);

  const handleCourseChange = (e) => {
    const c = courses.find(x => x._id === e.target.value);
    if (c) {
      setForm(f => ({
        ...f,
        course: c._id,
        courseCode: c.code,
        courseTitle: c.title,
        teacher: c.teacher?._id || '',
        teacherName: c.teacher?.name || '',
      }));
    } else {
      setForm(f => ({ ...f, course: '', courseCode: '', courseTitle: '' }));
    }
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <Modal isOpen={open} onClose={onClose} title={entry ? 'Edit Class' : 'Add Class'} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
          <select
            value={form.course}
            onChange={handleCourseChange}
            className="input w-full"
          >
            <option value="">Select course</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
            <input name="courseCode" value={form.courseCode} onChange={handleChange} className="input w-full" placeholder="e.g. CSE-101" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input name="room" value={form.room} onChange={handleChange} className="input w-full" placeholder="e.g. Room 301" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
          <input name="teacherName" value={form.teacherName} onChange={handleChange} className="input w-full" placeholder="Teacher's name" />
        </div>
      </div>
      <div className="flex justify-between items-center mt-6">
        <div>
          {entry && (
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
            >
              <FiTrash2 size={14} /> Clear slot
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || (!form.course && !form.courseCode)}
            className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50"
          >
            <FiCheck size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ClassRoutine() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [routine, setRoutine] = useState({ entries: [] });
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // courses for the add/edit modal
  const [courses, setCourses] = useState([]);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null); // { day, timeSlot }
  const [saving, setSaving] = useState(false);

  // clear confirm
  const [clearTarget, setClearTarget] = useState(null);
  const [clearing, setClearing] = useState(false);

  // Load faculties
  useEffect(() => {
    facultyService.getAllFaculties()
      .then(f => setFaculties(Array.isArray(f) ? f : []))
      .catch(() => {});
  }, []);

  // Auto-select faculty+semester for students
  useEffect(() => {
    if (isStudent && user?.faculty && user?.semester) {
      const fId = user.faculty?._id || user.faculty;
      setSelectedFaculty(fId);
      setSelectedSemester(String(user.semester));
    }
  }, [isStudent, user]);

  // Load routine when faculty+semester selected
  const loadRoutine = useCallback(async () => {
    if (!selectedFaculty || !selectedSemester) return;
    setLoading(true);
    try {
      const res = await classRoutineService.getRoutine(selectedFaculty, selectedSemester);
      setRoutine(res && res.entries ? res : { entries: [] });
    } catch {
      setRoutine({ entries: [] });
    } finally {
      setLoading(false);
    }
  }, [selectedFaculty, selectedSemester]);

  useEffect(() => { loadRoutine(); }, [loadRoutine]);

  // Load courses for modal (admin)
  useEffect(() => {
    if (!isAdmin || !selectedFaculty || !selectedSemester) return;
    courseService.getAllCourses({ faculty: selectedFaculty, semester: selectedSemester })
      .then(res => setCourses(Array.isArray(res) ? res : (Array.isArray(res?.courses) ? res.courses : [])))
      .catch(() => setCourses([]));
  }, [isAdmin, selectedFaculty, selectedSemester]);

  const getEntry = (day, timeSlot) =>
    routine.entries?.find(e => e.day === day && e.timeSlot === timeSlot) || null;

  const handleCellClick = (day, timeSlot) => {
    if (!editMode || !isAdmin) return;
    setActiveCell({ day, timeSlot });
    setModalOpen(true);
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const res = await classRoutineService.updateEntry({
        faculty: selectedFaculty,
        semester: parseInt(selectedSemester),
        day: activeCell.day,
        timeSlot: activeCell.timeSlot,
        ...form,
      });
      setRoutine(res && res.entries ? res : { entries: [] });
      toast.success('Class saved');
      setModalOpen(false);
    } catch (err) {
      if (err?.response?.status === 409) {
        const c = err.response.data?.conflict;
        toast.error(
          c
            ? `Conflict! ${form.teacherName || 'This teacher'} already has ${c.courseCode ? `"${c.courseCode}"` : 'a class'} in ${c.faculty} Sem ${c.semester} at this time.`
            : (err.response.data?.message || 'Schedule conflict detected.'),
          { autoClose: 7000 }
        );
      } else {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!clearTarget) return;
    setClearing(true);
    try {
      await classRoutineService.clearEntry({
        faculty: selectedFaculty,
        semester: parseInt(selectedSemester),
        day: clearTarget.day,
        timeSlot: clearTarget.timeSlot,
      });
      setRoutine(prev => ({
        ...prev,
        entries: prev.entries.filter(e => !(e.day === clearTarget.day && e.timeSlot === clearTarget.timeSlot)),
      }));
      toast.success('Slot cleared');
      setClearTarget(null);
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  const today = todayName();
  const filledCount = routine.entries?.length || 0;

  const activeEntry = activeCell ? getEntry(activeCell.day, activeCell.timeSlot) : null;

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2.5 rounded-xl">
              <FiCalendar size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Class Routine</h1>
              <p className="text-sm text-gray-500">
                {filledCount > 0 ? `${filledCount} class${filledCount !== 1 ? 'es' : ''} scheduled` : 'Weekly timetable'}
              </p>
            </div>
          </div>

          {isAdmin && selectedFaculty && selectedSemester && (
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition self-start ${
                editMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {editMode ? <><FiCheck size={15} /> Done Editing</> : <><FiEdit3 size={15} /> Edit Routine</>}
            </button>
          )}
        </div>

        {/* Filters */}
        {(!isStudent) && (
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedFaculty}
              onChange={e => { setSelectedFaculty(e.target.value); setSelectedSemester(''); }}
              className="input w-56"
            >
              <option value="">Select Faculty</option>
              {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              disabled={!selectedFaculty}
              className="input w-40"
            >
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{semesterLabel(s)}</option>)}
            </select>
          </div>
        )}

        {/* Student: show their info */}
        {isStudent && selectedFaculty && selectedSemester && (
          <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 text-sm text-primary-700 flex items-center gap-2">
            <FiCalendar size={14} />
            Showing routine for <strong>{faculties.find(f => (f._id === selectedFaculty || f._id === user?.faculty?._id))?.name || 'your faculty'}</strong> — {semesterLabel(selectedSemester)}
          </div>
        )}

        {/* Edit mode hint */}
        {editMode && isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
            <FiEdit3 size={14} />
            Click any cell to add or edit a class. Click a filled cell to edit or clear it.
          </div>
        )}

        {/* Empty state */}
        {!selectedFaculty || !selectedSemester ? (
          <div className="text-center py-20 text-gray-400">
            <FiCalendar size={44} className="mx-auto mb-3 opacity-25" />
            <p className="font-medium text-gray-500">Select a faculty and semester to view the routine</p>
          </div>
        ) : loading ? (
          <Loading />
        ) : (
          /* Timetable */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '720px' }}>
                <thead>
                  <tr>
                    <th className="bg-gray-900 text-white text-xs font-semibold px-4 py-3 text-left w-28 sticky left-0 z-10">
                      Time
                    </th>
                    {DAYS.map(day => (
                      <th
                        key={day}
                        className={`text-xs font-semibold px-3 py-3 text-center ${
                          day === today
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-700 text-primary-100'
                        }`}
                      >
                        <div>{day.slice(0, 3)}</div>
                        {day === today && <div className="text-primary-200 text-[10px] font-normal mt-0.5">Today</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((ts, idx) => (
                    <React.Fragment key={ts.slot}>
                      {/* Lunch break after slot index 3 (12:00-13:00) */}
                      {idx === 4 && (
                        <tr>
                          <td
                            colSpan={DAYS.length + 1}
                            className="bg-amber-50 border-y border-amber-100 px-4 py-3 text-center"
                          >
                            <span className="text-amber-700 text-sm font-semibold">
                              🍽 &nbsp; LUNCH BREAK &nbsp; 1:00 PM – 2:00 PM
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        {/* Time label */}
                        <td className="bg-gray-50 border-r border-gray-100 px-3 py-2 sticky left-0 z-10">
                          <div className="text-xs font-bold text-gray-700">{ts.label}</div>
                          <div className="text-[10px] text-gray-400">– {ts.end}</div>
                        </td>

                        {DAYS.map(day => {
                          const entry = getEntry(day, ts.slot);
                          const isToday = day === today;
                          const isMyClass = !isAdmin && user && entry?.teacher === user._id;

                          return (
                            <td
                              key={day}
                              className={`px-2 py-1.5 align-top transition ${isToday ? 'bg-primary-50/40' : ''} ${editMode && isAdmin ? 'cursor-pointer' : ''}`}
                              onClick={() => handleCellClick(day, ts.slot)}
                            >
                              {entry ? (
                                <div className={`rounded-xl p-2.5 border-l-4 bg-white shadow-sm transition h-full ${
                                  isMyClass
                                    ? 'border-green-500'
                                    : isToday
                                    ? 'border-primary-500'
                                    : 'border-primary-300'
                                } ${editMode ? 'hover:shadow-md hover:border-primary-500' : ''}`}>
                                  <p className="text-xs font-bold text-gray-900 leading-tight truncate">
                                    {entry.courseCode || 'Course'}
                                  </p>
                                  {entry.courseTitle && (
                                    <p className="text-[10px] text-gray-600 mt-0.5 leading-tight line-clamp-2">
                                      {entry.courseTitle}
                                    </p>
                                  )}
                                  {entry.teacherName && (
                                    <p className="text-[10px] text-gray-400 mt-1 truncate">👤 {entry.teacherName}</p>
                                  )}
                                  {entry.room && (
                                    <p className="text-[10px] text-gray-400 truncate">🚪 {entry.room}</p>
                                  )}
                                </div>
                              ) : (
                                editMode && isAdmin ? (
                                  <div className="rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition flex items-center justify-center h-full min-h-[64px]">
                                    <FiPlus size={14} className="text-gray-300 hover:text-primary-400 transition" />
                                  </div>
                                ) : (
                                  <div className="min-h-[64px]" />
                                )
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t border-gray-50 flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary-500 inline-block" /> Today's column
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-3 rounded bg-primary-300 inline-block" /> Scheduled class
              </span>
              {!isAdmin && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded bg-green-500 inline-block" /> Your class
                </span>
              )}
              {editMode && (
                <span className="flex items-center gap-1.5 ml-auto text-amber-600 font-medium">
                  <FiEdit3 size={11} /> Edit mode active — click cells to modify
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit cell modal */}
      <CellModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        entry={activeEntry}
        courses={courses}
        onSave={handleSave}
        onClear={() => { setClearTarget(activeCell); }}
        saving={saving}
      />

      {/* Clear confirm */}
      <ConfirmDialog
        open={!!clearTarget}
        title="Clear Class Slot"
        message={`Remove the class from ${clearTarget?.day} ${clearTarget?.timeSlot}? This cannot be undone.`}
        confirmLabel={clearing ? 'Clearing…' : 'Clear'}
        variant="danger"
        onConfirm={handleClear}
        onCancel={() => setClearTarget(null)}
      />
    </Layout>
  );
}
