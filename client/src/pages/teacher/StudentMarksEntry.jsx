import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loading from '../../components/shared/Loading';
import StudentMarksheet from './StudentMarksheet';
import './styles/StudentMarksEntry.css';

export default function StudentMarksEntry({ student, semester, onBack, onMarksUpdated }) {
  const [courses, setCourses] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showMarksheet, setShowMarksheet] = useState(false);
  const [marksheetData, setMarksheetData] = useState(null);

  useEffect(() => {
    fetchStudentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, semester]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/teacher/student/${student._id}/semester/${semester}`
      );

      console.log('[StudentMarksEntry] Full API Response:', response);
      console.log('[StudentMarksEntry] Courses from response:', response.courses);
      console.log('[StudentMarksEntry] Course count:', response.courses?.length);

      if (!response.courses || response.courses.length === 0) {
        console.warn('[StudentMarksEntry] ⚠️ No courses found for this student/semester');
        console.warn('Response details:', {
          studentId: student._id,
          semester: semester,
          courseCount: response.courses?.length,
          courseCountField: response.courseCount,
          gradedCourseCount: response.gradedCourseCount
        });
        setMessage('⚠️ No courses found for this student in semester ' + semester + '. Please ensure:' +
          '\n1. Courses exist for this semester' +
          '\n2. Your faculty is properly assigned' +
          '\n3. The course faculty matches your faculty');
      }

      setCourses(response.courses || []);

      // Initialize marks state
      const marksObj = {};
      (response.courses || []).forEach(course => {
        marksObj[course._id] = {
          obtainedMarks: course.marks?.obtainedMarks || '',
          totalMarks: course.marks?.totalMarks || course.totalMarks || 100
        };
      });
      setMarks(marksObj);
    } catch (error) {
      console.error('[StudentMarksEntry] Error fetching student details:', error);
      console.error('[StudentMarksEntry] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      setMessage('Failed to load student details: ' + (error?.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (courseId, field, value) => {
    setMarks(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [field]: field === 'totalMarks' ? parseInt(value) || 0 : parseFloat(value) || ''
      }
    }));
  };

  const calculatePercentage = (obtained, total) => {
    if (total === 0 || obtained === '') return '-';
    return ((obtained / total) * 100).toFixed(2);
  };

  const getGradeInfo = (percentage) => {
    percentage = parseFloat(percentage);
    if (percentage >= 80) return { grade: 'A+', gpa: 4.0 };
    if (percentage >= 75) return { grade: 'A', gpa: 3.75 };
    if (percentage >= 70) return { grade: 'A-', gpa: 3.5 };
    if (percentage >= 65) return { grade: 'B+', gpa: 3.25 };
    if (percentage >= 60) return { grade: 'B', gpa: 3.0 };
    if (percentage >= 55) return { grade: 'B-', gpa: 2.75 };
    if (percentage >= 50) return { grade: 'C+', gpa: 2.5 };
    if (percentage >= 45) return { grade: 'C', gpa: 2.25 };
    if (percentage >= 40) return { grade: 'D', gpa: 2.0 };
    return { grade: 'F', gpa: 0.0 };
  };

  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setMessage('');

      const marksToSave = [];
      let hasMarks = false;

      Object.keys(marks).forEach(courseId => {
        const courseMarks = marks[courseId];
        if (courseMarks.obtainedMarks !== '') {
          hasMarks = true;
          marksToSave.push({
            courseId,
            obtainedMarks: parseFloat(courseMarks.obtainedMarks),
            totalMarks: courseMarks.totalMarks
          });
        }
      });

      if (!hasMarks) {
        setMessage('Please enter marks for at least one course');
        setSaving(false);
        return;
      }

      // Save bulk marks
      const response = await api.post(
        '/teacher/marks/bulk-enter',
        {
          studentId: student._id,
          semester,
          marksData: marksToSave
        }
      );

      setMessage(`✓ Successfully saved ${response.saved} marks`);

      // Refresh data
      await fetchStudentDetails();
      if (onMarksUpdated) {
        onMarksUpdated();
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      setMessage('Failed to save marks: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateMarksheet = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/teacher/marksheet/${student._id}/semester/${semester}`
      );
      setMarksheetData(response);
      setShowMarksheet(true);
    } catch (error) {
      console.error('Error generating marksheet:', error);
      setMessage('Failed to generate marksheet');
    } finally {
      setLoading(false);
    }
  };

  if (showMarksheet && marksheetData) {
    return (
      <StudentMarksheet
        marksheet={marksheetData}
        onBack={() => setShowMarksheet(false)}
      />
    );
  }

  if (loading) return <Loading />;

  return (
    <div className="marks-entry-container">
      <div className="entry-header">
        <button className="btn-back" onClick={onBack}>← Back to Students</button>
        <div className="student-info-header">
          <h2>{student.name}</h2>
          <p className="meta-info">
            {student.registrationNumber} | Semester {semester}
          </p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Failed') ? 'alert-error' : message.includes('⚠️') ? 'alert-warning' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="no-courses-message">
          <div className="warning-box">
            <h3>⚠️ No Courses Found</h3>
            <p>This might be because:</p>
            <ul>
              <li>No courses exist for semester {semester}</li>
              <li>The courses haven't been assigned to your faculty</li>
              <li>Your faculty assignment might be pending</li>
            </ul>
            <p style={{marginTop: '12px', fontSize: '0.9em', color: '#666'}}>
              Please contact an administrator to ensure:
              <br />✓ Courses are created for semester {semester}
              <br />✓ You have a faculty assigned
              <br />✓ Course faculty matches your assigned faculty
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="marks-table-container">
        <table className="marks-entry-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Credits</th>
              <th>Obtained Marks</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>GPA</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => {
              const courseMarks = marks[course._id] || {};
              const percentage = calculatePercentage(
                courseMarks.obtainedMarks,
                courseMarks.totalMarks
              );
              const gradeInfo = percentage !== '-' ? getGradeInfo(percentage) : {};

              return (
                <tr key={course._id}>
                  <td className="course-code">{course.code}</td>
                  <td className="course-title">{course.title}</td>
                  <td className="credits">{course.creditHours || '-'}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max={courseMarks.totalMarks || 100}
                      value={courseMarks.obtainedMarks || ''}
                      onChange={(e) =>
                        handleMarksChange(course._id, 'obtainedMarks', e.target.value)
                      }
                      placeholder="0"
                      className="marks-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={courseMarks.totalMarks || 100}
                      onChange={(e) =>
                        handleMarksChange(course._id, 'totalMarks', e.target.value)
                      }
                      className="marks-input"
                    />
                  </td>
                  <td className="percentage">{percentage}%</td>
                  <td className="grade">
                    {gradeInfo.grade && (
                      <span className={`grade-badge grade-${gradeInfo.grade.toLowerCase()}`}>
                        {gradeInfo.grade}
                      </span>
                    )}
                  </td>
                  <td className="gpa">
                    {gradeInfo.gpa !== undefined && (
                      <span className="gpa-value">{gradeInfo.gpa.toFixed(2)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="marks-actions">
        <button
          className="btn btn-primary"
          onClick={handleSaveMarks}
          disabled={saving || courses.length === 0}
        >
          {saving ? 'Saving...' : '💾 Save All Marks'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleGenerateMarksheet}
          disabled={loading}
        >
          {loading ? 'Loading...' : '📄 View Marksheet'}
        </button>
      </div>

      <div className="cgpa-calculator">
        <h3>📊 CGPA Calculation Formula</h3>
        <div className="formula-box">
          <p><strong>CGPA = Σ(Grade Point × Credit Hours) ÷ Total Credit Hours</strong></p>
          <p className="formula-example">Example: If you have (4.0 × 3) + (3.75 × 3) + (3.5 × 4) = Total 33.75 points, and 10 total credits, then CGPA = 33.75 ÷ 10 = 3.375</p>
        </div>
      </div>

      <div className="gpa-reference">
        <h4>Grade Reference</h4>
        <div className="reference-grid">
          <span>A+: 80-100% (4.0)</span>
          <span>A: 75-79% (3.75)</span>
          <span>A-: 70-74% (3.5)</span>
          <span>B+: 65-69% (3.25)</span>
          <span>B: 60-64% (3.0)</span>
          <span>B-: 55-59% (2.75)</span>
          <span>C+: 50-54% (2.5)</span>
          <span>C: 45-49% (2.25)</span>
          <span>D: 40-44% (2.0)</span>
          <span>F: 0-39% (0.0)</span>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
