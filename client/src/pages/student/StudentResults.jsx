import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { gradeService } from '../../services/gradeService';
import { generateMarksheetPDF } from '../../utils/generateMarksheetPDF';
import CGPAProgressionChart from './CGPAProgressionChart';
import { formatCGPA } from '../../utils/formatters';
import { FiDownload, FiBookOpen, FiAward, FiBarChart2, FiList } from 'react-icons/fi';

const GRADE_COLORS = {
  'A+': 'bg-emerald-100 text-emerald-700',
  'A':  'bg-green-100 text-green-700',
  'A-': 'bg-teal-100 text-teal-700',
  'B+': 'bg-cyan-100 text-cyan-700',
  'B':  'bg-blue-100 text-blue-700',
  'B-': 'bg-indigo-100 text-indigo-700',
  'C+': 'bg-violet-100 text-violet-700',
  'C':  'bg-purple-100 text-purple-700',
  'D':  'bg-amber-100 text-amber-700',
  'F':  'bg-red-100 text-red-700',
};

const GPA_SCALE = [
  ['A+', '4.00', '80–100%'], ['A',  '3.75', '75–79%'],  ['A-', '3.50', '70–74%'],
  ['B+', '3.25', '65–69%'],  ['B',  '3.00', '60–64%'],  ['B-', '2.75', '55–59%'],
  ['C+', '2.50', '50–54%'],  ['C',  '2.25', '45–49%'],  ['D',  '2.00', '40–44%'],
  ['F',  '0.00', '0–39%'],
];

export default function StudentResults() {
  const { user } = useAuth();
  const [results, setResults]                   = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [view, setView]                         = useState('grades'); // 'grades' | 'chart'
  const [downloading, setDownloading]           = useState(false);

  useEffect(() => {
    gradeService.getStudentResults()
      .then((data) => {
        setResults(data);
        if (data?.resultsBySemester) {
          const sems = Object.keys(data.resultsBySemester).map(Number).sort((a, b) => a - b);
          if (sems.length) setSelectedSemester(sems[0]);
        }
      })
      .catch(() => setError('Failed to load results. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPDF = () => {
    if (!results || !selectedSemester) return;
    setDownloading(true);
    try {
      const semData = results.resultsBySemester[selectedSemester];
      const avgPct = semData.grades.length
        ? (semData.grades.reduce((s, g) => s + (g.percentage || 0), 0) / semData.grades.length).toFixed(2)
        : '0.00';

      generateMarksheetPDF({
        student: {
          name:               user?.name               || '—',
          registrationNumber: user?.registrationNumber || '—',
          studentId:          user?.studentId          || '—',
          email:              user?.email              || '—',
          faculty:            user?.faculty?.name      || user?.faculty || '—',
        },
        semester: selectedSemester,
        courses: semData.grades.map(g => ({
          code:          g.course,
          title:         g.title,
          credits:       g.credits,
          obtainedMarks: g.obtainedMarks,
          totalMarks:    g.totalMarks,
          percentage:    g.percentage,
          grade:         g.grade,
          gpa:           g.gpa,
        })),
        statistics: {
          totalCourses: semData.grades.length,
          totalCredits: semData.totalCredits,
          percentage:   avgPct,
          sgpa:         semData.semesterGPA,
        },
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </Layout>
    );
  }

  const semesters = results?.resultsBySemester
    ? Object.keys(results.resultsBySemester).map(Number).sort((a, b) => a - b)
    : [];

  const semData = selectedSemester ? results?.resultsBySemester?.[selectedSemester] : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
            <p className="text-sm text-gray-500 mt-0.5">Grades and academic performance</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            {semesters.length > 0 && (
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setView('grades')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'grades' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                >
                  <FiList size={13} /> Grades
                </button>
                <button
                  onClick={() => setView('chart')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'chart' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                >
                  <FiBarChart2 size={13} /> Chart
                </button>
              </div>
            )}
            {semData && view === 'grades' && (
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50"
              >
                <FiDownload size={15} />
                {downloading ? 'Generating…' : 'Download PDF'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* No results */}
        {!semesters.length && !error && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <FiBookOpen size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No results available yet</p>
            <p className="text-sm text-gray-400 mt-1">Your grades will appear here once published by your teacher</p>
          </div>
        )}

        {semesters.length > 0 && (
          <>
            {/* CGPA overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl p-5 shadow-md">
                <p className="text-primary-100 text-xs font-medium uppercase tracking-widest mb-1">CGPA</p>
                <p className="text-4xl font-bold">{formatCGPA(results.cgpa)}</p>
                <p className="text-primary-200 text-xs mt-1">Cumulative across all semesters</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="bg-secondary-100 p-3 rounded-lg">
                  <FiAward size={24} className="text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Semesters with results</p>
                  <p className="text-3xl font-bold text-gray-800">{semesters.length}</p>
                </div>
              </div>
            </div>

            {/* Chart view */}
            {view === 'chart' && (
              <CGPAProgressionChart
                resultsBySemester={results.resultsBySemester}
                cgpa={results.cgpa}
              />
            )}

            {/* Grades view */}
            {view === 'grades' && (
              <>
                {/* Semester tabs */}
                <div className="flex gap-2 flex-wrap">
                  {semesters.map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemester(sem)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                        selectedSemester === sem
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                      }`}
                    >
                      Semester {sem}
                    </button>
                  ))}
                </div>

                {semData && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-800">Semester {selectedSemester}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{semData.grades.length} course(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">SGPA</p>
                        <p className="text-2xl font-bold text-primary-600">{semData.semesterGPA}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-2.5 text-left font-medium text-gray-600">Code</th>
                            <th className="px-4 py-2.5 text-left font-medium text-gray-600">Course</th>
                            <th className="px-4 py-2.5 text-center font-medium text-gray-600">Cr</th>
                            <th className="px-4 py-2.5 text-center font-medium text-gray-600">Marks</th>
                            <th className="px-4 py-2.5 text-center font-medium text-gray-600">%</th>
                            <th className="px-4 py-2.5 text-center font-medium text-gray-600">Grade</th>
                            <th className="px-4 py-2.5 text-center font-medium text-gray-600">GPA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {semData.grades.map((g, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-xs text-primary-600 font-medium">{g.course}</td>
                              <td className="px-4 py-3 text-gray-800">{g.title}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{g.credits}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{g.obtainedMarks}/{g.totalMarks}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{Number(g.percentage).toFixed(1)}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${GRADE_COLORS[g.grade] || 'bg-gray-100 text-gray-600'}`}>
                                  {g.grade}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-gray-700">
                                {Number(g.gpa).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="px-5 py-4 bg-green-50 border-t border-green-100 flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs text-gray-500">Total Courses</p>
                        <p className="font-bold text-gray-800">{semData.grades.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Credits</p>
                        <p className="font-bold text-gray-800">{semData.totalCredits}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Semester GPA</p>
                        <p className="font-bold text-green-700 text-lg">{semData.semesterGPA}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* GPA scale */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">GPA Scale Reference</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {GPA_SCALE.map(([grade, gpa, range]) => (
                      <div key={grade} className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${GRADE_COLORS[grade] || 'bg-gray-100 text-gray-600'}`}>
                          {grade}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-gray-700">{gpa}</p>
                          <p className="text-xs text-gray-400">{range}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
