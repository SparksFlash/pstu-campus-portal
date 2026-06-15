import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import Loading from '../../components/shared/Loading';
import './styles/CourseGrading.css';

export default function CourseGrading() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Fetch teacher's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await courseService.getTeacherCourses();
        setCourses(response || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setMessage('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'teacher') {
      fetchCourses();
    }
  }, [user]);

  // Fetch students for selected course
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;
      try {
        setLoading(true);
        const response = await courseService.getCourseStudents(selectedCourse._id);
        setStudents(response || []);
        // Initialize grades object
        const gradesObj = {};
        (response || []).forEach((student) => {
          gradesObj[student._id] = {
            obtainedMarks: '',
            totalMarks: selectedCourse.totalMarks || 100,
          };
        });
        setGrades(gradesObj);
      } catch (error) {
        console.error('Error fetching students:', error);
        setMessage('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedCourse]);

  const handleMarksChange = (studentId, field, value) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === 'totalMarks' ? parseInt(value) || 0 : parseFloat(value) || 0,
      },
    }));
  };

  const calculatePercentage = (obtained, total) => {
    if (total === 0) return 0;
    return ((obtained / total) * 100).toFixed(2);
  };

  const getGradeInfo = (percentage) => {
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

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Validate marks before sending
      let validationError = '';
      Object.entries(grades).forEach(([, marksData]) => {
        if (marksData.obtainedMarks !== '' && !validationError) {
          const obtained = parseFloat(marksData.obtainedMarks);
          const total = parseFloat(marksData.totalMarks) || 100;
          if (total > 100) {
            validationError = 'Total marks cannot exceed 100';
          } else if (obtained < 0 || obtained > total) {
            validationError = `Obtained marks must be between 0 and ${total}`;
          }
        }
      });
      if (validationError) {
        setMessage(`✗ ${validationError}`);
        setSaving(false);
        return;
      }

      const gradesToSave = [];
      Object.keys(grades).forEach((studentId) => {
        const marksData = grades[studentId];
        if (marksData.obtainedMarks !== '') {
          gradesToSave.push({
            student: studentId,
            course: selectedCourse._id,
            semester: selectedSemester,
            obtainedMarks: marksData.obtainedMarks,
            totalMarks: marksData.totalMarks,
          });
        }
      });

      if (gradesToSave.length === 0) {
        setMessage('Please enter marks for at least one student');
        setSaving(false);
        return;
      }

      // Save grades (you may want to batch these)
      for (const gradeData of gradesToSave) {
        await courseService.recordGrade(gradeData);
      }

      setMessage(`✓ Successfully saved ${gradesToSave.length} grades`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving grades:', error);
      setMessage('Failed to save grades: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading && courses.length === 0) return <Loading />;

  const filteredCourses = courses.filter((c) => c.semester === selectedSemester);

  return (
    <div className="course-grading-container">
      <div className="page-header">
        <h1>📊 Grade Students</h1>
        <p>Enter marks for your students</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('Failed') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="grading-controls">
        <div className="control-group">
          <label htmlFor="semester">Semester:</label>
          <select
            id="semester"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="course">Course:</label>
          <select
            id="course"
            value={selectedCourse?._id || ''}
            onChange={(e) => {
              const course = filteredCourses.find((c) => c._id === e.target.value);
              setSelectedCourse(course);
            }}
          >
            <option value="">Select a course...</option>
            {filteredCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCourse && (
        <div className="grading-table-container">
          <h3>{selectedCourse.code}: {selectedCourse.title}</h3>
          <p className="course-info">
            {students.length} students | Total Marks: {selectedCourse.totalMarks || 100}
          </p>

          {students.length === 0 ? (
            <p className="no-students">No students enrolled in this course</p>
          ) : (
            <table className="grading-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Obtained Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>GPA</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const studentMarks = grades[student._id] || {};
                  const percentage = calculatePercentage(
                    studentMarks.obtainedMarks || 0,
                    studentMarks.totalMarks || 100
                  );
                  const gradeInfo = getGradeInfo(percentage);

                  return (
                    <tr key={student._id}>
                      <td>{student.name}</td>
                      <td>{student.registrationNumber || 'N/A'}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={studentMarks.totalMarks || 100}
                          value={studentMarks.obtainedMarks || ''}
                          onChange={(e) =>
                            handleMarksChange(student._id, 'obtainedMarks', e.target.value)
                          }
                          placeholder="0"
                          className="marks-input"
                        />
                        /{studentMarks.totalMarks || 100}
                      </td>
                      <td className="percentage">{percentage}%</td>
                      <td className="grade">{gradeInfo.grade}</td>
                      <td className="gpa">{gradeInfo.gpa.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="grading-actions">
            <button
              className="btn btn-primary"
              onClick={handleSaveGrades}
              disabled={saving || students.length === 0}
            >
              {saving ? 'Saving...' : '💾 Save All Grades'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
