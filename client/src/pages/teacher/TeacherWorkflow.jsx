import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import teacherService from '../../services/teacherService';
import { generateMarksheetPDF } from '../../utils/generateMarksheetPDF';
import {
import { semesterLabel } from '../../utils/formatters';
  FiChevronLeft, FiUsers, FiEdit3, FiDownload, FiSave, FiRefreshCw,
} from 'react-icons/fi';

// Grade colour helper
const gradeColor = (grade) => {
  if (!grade) return 'text-gray-400';
  if (['A+', 'A', 'A-'].includes(grade)) return 'text-green-600 font-semibold';
  if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600 font-semibold';
  if (['C+', 'C'].includes(grade)) return 'text-yellow-600 font-semibold';
  if (grade === 'D') return 'text-orange-600 font-semibold';
  return 'text-red-600 font-semibold';
};

// Client-side grade calculator (mirrors gradingScale.js)
const calcGrade = (obtained, total) => {
  if (obtained === '' || obtained === undefined || total <= 0) return { grade: '—', gpa: '—', pct: '—' };
  const pct = (parseFloat(obtained) / parseFloat(total)) * 100;
  if (pct >= 80)  return { grade: 'A+', gpa: 4.00, pct: pct.toFixed(2) };
  if (pct >= 75)  return { grade: 'A',  gpa: 3.75, pct: pct.toFixed(2) };
  if (pct >= 70)  return { grade: 'A-', gpa: 3.50, pct: pct.toFixed(2) };
  if (pct >= 65)  return { grade: 'B+', gpa: 3.25, pct: pct.toFixed(2) };
  if (pct >= 60)  return { grade: 'B',  gpa: 3.00, pct: pct.toFixed(2) };
  if (pct >= 55)  return { grade: 'B-', gpa: 2.75, pct: pct.toFixed(2) };
  if (pct >= 50)  return { grade: 'C+', gpa: 2.50, pct: pct.toFixed(2) };
  if (pct >= 45)  return { grade: 'C',  gpa: 2.25, pct: pct.toFixed(2) };
  if (pct >= 40)  return { grade: 'D',  gpa: 2.00, pct: pct.toFixed(2) };
  return { grade: 'F', gpa: 0.00, pct: pct.toFixed(2) };
};

// ─── Step 1: Student List ────────────────────────────────────────────────────

function StudentListPanel({ semester, onSelect }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherService.getStudentsBySemester(semester);
      setStudents(res.students || []);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [semester]);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.registrationNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{students.length} student(s) in {semesterLabel(semester)}</p>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or ID…"
            className="input w-52"
          />
          <button onClick={load} className="btn-outline flex items-center gap-1.5">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiUsers size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No students found</p>
          <p className="text-sm mt-1">
            {students.length === 0
              ? 'No students enrolled in this semester under your faculty.'
              : 'No matches for your search.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((s) => (
            <div
              key={s._id}
              onClick={() => onSelect(s)}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-primary-50 rounded-lg cursor-pointer transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-600">{s.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.registrationNumber || s.studentId || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {s.gradesCount > 0 && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                    {s.gradesCount} grade{s.gradesCount !== 1 ? 's' : ''}
                  </span>
                )}
                <FiEdit3 size={15} className="text-gray-300 group-hover:text-primary-500 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Marks Entry ─────────────────────────────────────────────────────

function MarksEntryPanel({ student, semester, onBack, onSaved }) {
  const [courses, setCourses]   = useState([]);
  const [marks, setMarks]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherService.getStudentDetails(student._id, semester);
      setCourses(res.courses || []);
      const init = {};
      (res.courses || []).forEach((c) => {
        init[c._id] = {
          obtained: c.marks?.obtainedMarks ?? '',
          total: c.marks?.totalMarks ?? c.totalMarks ?? 100,
        };
      });
      setMarks(init);
    } catch (err) {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  }, [student._id, semester]);

  useEffect(() => { load(); }, [load]);

  const set = (courseId, field, value) =>
    setMarks((prev) => ({ ...prev, [courseId]: { ...prev[courseId], [field]: value } }));

  const handleSave = async () => {
    const marksData = Object.entries(marks)
      .filter(([, v]) => v.obtained !== '')
      .map(([courseId, v]) => ({
        courseId,
        obtainedMarks: parseFloat(v.obtained),
        totalMarks: parseFloat(v.total) || 100,
      }));

    if (!marksData.length) { toast.warn('Enter marks for at least one course'); return; }

    setSaving(true);
    try {
      const res = await teacherService.bulkEnterMarks(student._id, semester, marksData);
      toast.success(`Saved ${res.saved} mark(s) successfully`);
      await load();
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const data = await teacherService.generateMarksheet(student._id, semester);
      await generateMarksheetPDF(data);
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      {/* Student header */}
      <div className="flex items-center gap-4 mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
          <FiChevronLeft size={16} /> Back to students
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-600">{student.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{student.name}</p>
            <p className="text-xs text-gray-400">{semesterLabel(semester)} · {student.registrationNumber || student.studentId || '—'}</p>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-medium">No courses found</p>
          <p className="text-sm mt-1">
            Make sure courses are created for {semesterLabel(semester)} under your faculty.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Course</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">Cr</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Obtained</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">%</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">Grade</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courses.map((c) => {
                  const m = marks[c._id] || {};
                  const { grade, gpa, pct } = calcGrade(m.obtained, m.total);
                  return (
                    <tr key={c._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{c.title}</td>
                      <td className="px-4 py-2.5 text-center text-gray-500">{c.creditHours || '—'}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          max={m.total || 100}
                          value={m.obtained}
                          onChange={(e) => set(c._id, 'obtained', e.target.value)}
                          placeholder="0"
                          className="input w-20 text-center"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={1}
                          value={m.total}
                          onChange={(e) => set(c._id, 'total', e.target.value)}
                          className="input w-20 text-center"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{pct !== '—' ? `${pct}%` : '—'}</td>
                      <td className={`px-4 py-2.5 text-center ${gradeColor(grade)}`}>{grade}</td>
                      <td className="px-4 py-2.5 text-center text-gray-700">{typeof gpa === 'number' ? gpa.toFixed(2) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <FiSave size={15} />
              {saving ? 'Saving…' : 'Save All Marks'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="btn-outline flex items-center gap-2"
            >
              <FiDownload size={15} />
              {downloading ? 'Generating…' : 'Download PDF'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TeacherWorkflow() {
  const [semester, setSemester]             = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleStudentSelect = (student) => setSelectedStudent(student);
  const handleBack = () => setSelectedStudent(null);

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marks Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Enter and manage student marks semester by semester</p>
          </div>
          {/* Semester Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Semester:</label>
            <select
              value={semester}
              onChange={(e) => { setSemester(parseInt(e.target.value)); setSelectedStudent(null); }}
              className="input w-36"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>{semesterLabel(s)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-3 py-1 rounded-full font-medium transition ${!selectedStudent ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            1. Select Student
          </span>
          <span className="text-gray-300">→</span>
          <span className={`px-3 py-1 rounded-full font-medium transition ${selectedStudent ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
            2. Enter Marks
          </span>
        </div>

        {/* Content panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {selectedStudent ? (
            <MarksEntryPanel
              student={selectedStudent}
              semester={semester}
              onBack={handleBack}
              onSaved={() => {}}
            />
          ) : (
            <StudentListPanel
              semester={semester}
              onSelect={handleStudentSelect}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
