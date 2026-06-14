import React from 'react';
import './styles/StudentList.css';

export default function StudentList({ students, semester, onSelectStudent }) {
  return (
    <div className="student-list-container">
      {students.length === 0 ? (
        <div className="students-empty">
          <div className="students-empty-icon">👥</div>
          <h3>No Students Found</h3>
          <p>No students enrolled in Semester {semester} under your faculty.</p>
        </div>
      ) : (
        <>
          <ul className="students-grid">
            {students.map((student) => {
              const initial = student.name?.charAt(0)?.toUpperCase() || 'S';
              const gradeStatus = student.gradesCount > 0 
                ? `${student.gradesCount} grades` 
                : 'Pending';

              return (
                <li key={student._id} className="student-card">
                  <div className="student-avatar">
                    {student.profilePicture ? (
                      <img src={student.profilePicture} alt={student.name} />
                    ) : (
                      initial
                    )}
                  </div>

                  <div className="student-info">
                    <p className="student-name">{student.name}</p>
                    <p className="student-meta">{student.registrationNumber}</p>
                    <p className="student-meta">{student.email}</p>
                    <span className="student-registration">
                      Roll: {student.registrationNumber || 'N/A'}
                    </span>
                  </div>

                  <div className="student-footer">
                    <span className="grade-badge">{gradeStatus}</span>
                  </div>

                  <button
                    className="select-btn"
                    onClick={() => onSelectStudent(student)}
                  >
                    Enter Marks →
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
