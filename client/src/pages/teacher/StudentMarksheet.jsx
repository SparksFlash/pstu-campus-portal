import React from 'react';
import './styles/StudentMarksheet.css';

export default function StudentMarksheet({ marksheet, onBack }) {

  return (
    <div className="marksheet-container">
      <button className="btn-back" onClick={onBack}>← Back to Marks Entry</button>

      <div className="marksheet-header">
        <h1>Student Marksheet</h1>
        <div className="student-details">
          <p><strong>Name:</strong> {marksheet.student?.name}</p>
          <p><strong>Registration:</strong> {marksheet.student?.registrationNumber}</p>
          <p><strong>Semester:</strong> {marksheet.semester}</p>
          <p><strong>SGPA:</strong> <span className="sgpa-highlight">{marksheet.sgpa?.toFixed(2)}</span></p>
        </div>
      </div>

      <div className="marksheet-table-container">
        <table className="marksheet-table">
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
            {marksheet.courses?.map((course, idx) => (
              <tr key={idx}>
                <td className="course-code">{course.code}</td>
                <td className="course-title">{course.title}</td>
                <td className="credits">{course.creditHours || '-'}</td>
                <td className="marks">{course.obtainedMarks}</td>
                <td className="marks">{course.totalMarks}</td>
                <td className="percentage">{course.percentage?.toFixed(2)}%</td>
                <td className="grade">
                  <span
                    className={`grade-badge grade-${course.grade?.toLowerCase()}`}
                  >
                    {course.grade}
                  </span>
                </td>
                <td className="gpa">{course.gpa?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="marksheet-summary">
        <div className="summary-item">
          <span className="label">Total Courses:</span>
          <span className="value">{marksheet.courses?.length || 0}</span>
        </div>
        <div className="summary-item">
          <span className="label">Total Credits:</span>
          <span className="value">{marksheet.statistics?.totalCredits || 0}</span>
        </div>
        <div className="summary-item">
          <span className="label">Obtained Marks:</span>
          <span className="value">
            {marksheet.statistics?.obtainedMarks || 0} / {marksheet.statistics?.totalMarks || 0}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">Overall Percentage:</span>
          <span className="value">{marksheet.statistics?.percentage}%</span>
        </div>
        <div className="summary-item highlight">
          <span className="label">Semester GPA (SGPA):</span>
          <span className="value">{marksheet.statistics?.sgpa || marksheet.sgpa?.toFixed(2)}</span>
        </div>
      </div>

      <div className="cgpa-formula-display">
        <h3>📊 SGPA Calculation Method</h3>
        <div className="formula-explanation">
          <p><strong>Formula: SGPA = Σ(GPA × Credit Hours) ÷ Total Credit Hours Completed</strong></p>
          <p className="calculation-example">
            <strong>Calculation:</strong> If you got grades like:
            <br/>• Course 1: GPA 4.0 × 3 credits = 12.0 points
            <br/>• Course 2: GPA 3.75 × 4 credits = 15.0 points
            <br/>• Course 3: GPA 3.5 × 3 credits = 10.5 points
            <br/><strong>SGPA = (12.0 + 15.0 + 10.5) ÷ (3+4+3) = 37.5 ÷ 10 = 3.75</strong>
          </p>
        </div>
      </div>

      <div className="gradeDistribution">
        <h3>Grade Distribution</h3>
        <div className="distribution-grid">
          {marksheet.gradeDistribution && Object.keys(marksheet.gradeDistribution).map(grade => (
            <div key={grade} className="distribution-item">
              <span className={`grade-label grade-${grade.toLowerCase()}`}>
                {grade}
              </span>
              <span className="count">{marksheet.gradeDistribution[grade]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="marksheet-footer">
        <p>Generated on: {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
    </div>
  );
}
