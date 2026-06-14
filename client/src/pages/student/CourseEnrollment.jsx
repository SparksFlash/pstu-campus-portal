import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import enrollmentService from '../../services/enrollmentService';
import { toast } from 'react-toastify';
import { FiBookOpen, FiCheck, FiX, FiRefreshCw, FiList, FiSearch } from 'react-icons/fi';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function CourseEnrollment() {
  const [tab, setTab]           = useState('available'); // 'available' | 'enrolled'
  const [semFilter, setSemFilter] = useState('');
  const [search, setSearch]     = useState('');
  const [courses, setCourses]   = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [actionId, setActionId] = useState(null); // courseId or enrollmentId being acted on

  const loadAvailable = useCallback(async () => {
    setLoading(true);
    try {
      const data = await enrollmentService.getAvailableCourses(semFilter || undefined);
      setCourses(data || []);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [semFilter]);

  const loadEnrolled = useCallback(async () => {
    setLoading(true);
    try {
      const data = await enrollmentService.getMyEnrollments(semFilter || undefined, 'enrolled');
      setEnrolled(data || []);
    } catch {
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  }, [semFilter]);

  useEffect(() => {
    if (tab === 'available') loadAvailable();
    else                     loadEnrolled();
  }, [tab, loadAvailable, loadEnrolled]);

  const handleEnroll = async (courseId) => {
    setActionId(courseId);
    try {
      await enrollmentService.enrollCourse(courseId);
      toast.success('Enrolled successfully');
      loadAvailable();
    } catch (err) {
      toast.error(err?.message || 'Enrollment failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDrop = async (enrollmentId) => {
    if (!window.confirm('Drop this course? You can re-enroll later.')) return;
    setActionId(enrollmentId);
    try {
      await enrollmentService.dropCourse(enrollmentId);
      toast.success('Course dropped');
      loadEnrolled();
    } catch (err) {
      toast.error(err?.message || 'Failed to drop course');
    } finally {
      setActionId(null);
    }
  };

  const filteredCourses = courses.filter(c =>
    !search ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEnrolled = enrolled.filter(e =>
    !search ||
    e.course?.code?.toLowerCase().includes(search.toLowerCase()) ||
    e.course?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-secondary-100 p-2 rounded-lg">
              <FiBookOpen size={20} className="text-secondary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Enrollment</h1>
              <p className="text-sm text-gray-500">Enroll in or drop courses</p>
            </div>
          </div>
          <button onClick={tab === 'available' ? loadAvailable : loadEnrolled} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
            <FiRefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Tabs + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => { setTab('available'); setSearch(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === 'available' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FiBookOpen size={14} /> Available
            </button>
            <button
              onClick={() => { setTab('enrolled'); setSearch(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === 'enrolled' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FiList size={14} /> My Enrollments
              {enrolled.length > 0 && (
                <span className="bg-primary-100 text-primary-600 text-xs px-1.5 py-0.5 rounded-full">{enrolled.length}</span>
              )}
            </button>
          </div>

          <div className="flex gap-2 flex-1">
            <select
              value={semFilter}
              onChange={e => setSemFilter(e.target.value)}
              className="input w-36"
            >
              <option value="">All semesters</option>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <div className="relative flex-1 max-w-xs">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="input pl-8"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : tab === 'available' ? (
            filteredCourses.length === 0 ? (
              <div className="p-10 text-center">
                <FiBookOpen size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No courses found for selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">Code</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">Course Title</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">Credits</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">Semester</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">Teacher</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCourses.map(c => (
                      <tr key={c._id} className={`hover:bg-gray-50 ${c.isEnrolled ? 'opacity-70' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-primary-600 font-medium">{c.code}</td>
                        <td className="px-4 py-3 text-gray-800">{c.title}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{c.creditHours ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{c.semester}</td>
                        <td className="px-4 py-3 text-gray-500">{c.teacher?.name || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {c.isEnrolled ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <FiCheck size={13} /> Enrolled
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEnroll(c._id)}
                              disabled={actionId === c._id}
                              className="btn-primary text-xs py-1 px-3 disabled:opacity-50"
                            >
                              {actionId === c._id ? '…' : 'Enroll'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filteredEnrolled.length === 0 ? (
              <div className="p-10 text-center">
                <FiList size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">You have not enrolled in any courses yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">Code</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">Course Title</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">Credits</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">Semester</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">Enrolled On</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEnrolled.map(e => (
                      <tr key={e._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-primary-600 font-medium">{e.course?.code || '—'}</td>
                        <td className="px-4 py-3 text-gray-800">{e.course?.title || '—'}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{e.course?.creditHours ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{e.semester}</td>
                        <td className="px-4 py-3 text-center text-gray-400 text-xs">
                          {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDrop(e._id)}
                            disabled={actionId === e._id}
                            className="flex items-center gap-1 mx-auto text-xs text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                          >
                            <FiX size={12} />
                            {actionId === e._id ? '…' : 'Drop'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
