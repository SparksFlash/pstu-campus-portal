import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import { userService } from '../../services/userService';
import { semesterLabel } from '../../utils/formatters';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async (search) => {
    try {
      setLoading(true);
      // use role-based endpoint to ensure teachers can fetch all students
      const res = await userService.getByRole('student', { q: search });
      setStudents(res || []);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(''); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(q);
  };

  if (loading) return <Layout><Loading /></Layout>;

  // Group students by faculty -> semester
  const grouped = students.reduce((acc, s) => {
    const fac = (s.faculty && (s.faculty.name || s.faculty)) || 'Unassigned';
    // Try common semester fields, fallback to Unknown
    const sem = s.semester || s.currentSemester || s.enrolledSemester || 'Unknown';
    acc[fac] = acc[fac] || {};
    acc[fac][sem] = acc[fac][sem] || [];
    acc[fac][sem].push(s);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Students</h2>
        <form onSubmit={handleSearch} className="mb-4">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email" className="input mr-2" />
          <button className="btn-primary">Search</button>
        </form>

        {Object.keys(grouped).length === 0 && (
          <div className="p-4 text-gray-600">No students found</div>
        )}

        {Object.entries(grouped).map(([facName, semesters]) => (
          <div key={facName} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{facName}</h3>
            {Object.entries(semesters).map(([sem, list]) => (
              <div key={sem} className="mb-4 border rounded">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <div>
                    <span className="font-medium">{semesterLabel(sem)}</span>
                    <span className="text-sm text-gray-500 ml-2">({list.length})</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left">
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Reg. No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(s => (
                        <tr key={s._id} className="border-t">
                          <td className="p-2">{s.name}</td>
                          <td className="p-2">{s.email}</td>
                          <td className="p-2">{s.registrationNumber || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Students;
