import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { validateEmail, validatePassword } from '../../utils/validators';
import { facultyService } from '../../services/facultyService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [facultiesLoading, setFacultiesLoading] = useState(false);
  const [facultiesError, setFacultiesError] = useState('');
  const [faculty, setFaculty] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = location.state?.info || '';

  React.useEffect(() => {
    let mounted = true;
    const loadFaculties = async () => {
      setFacultiesLoading(true);
      setFacultiesError('');
      try {
        const f = await facultyService.getAllFaculties();
        if (!mounted) return;
        setFaculties(f || []);
      } catch (err) {
        console.error('Failed to load faculties in Login:', err);
        if (mounted) {
          setFaculties([]);
          setFacultiesError(err?.message || 'Failed to load faculties');
        }
      } finally {
        if (mounted) setFacultiesLoading(false);
      }
    };
    loadFaculties();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // For students, require registrationNumber, studentId and faculty
    if (role === 'student') {
      if (!registrationNumber || !studentId || !faculty) {
        setError('Students must provide Registration Number, Student ID and select Faculty');
        return;
      }
    }

    // For teachers require faculty and email
    if (role === 'teacher') {
      if (!faculty) {
        setError('Please select your faculty');
        return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email');
        return;
      }
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const creds = { password, role };
      if (email) creds.email = email;
      if (registrationNumber) creds.registrationNumber = registrationNumber;
      if (studentId) creds.studentId = studentId;
      if (faculty) creds.faculty = faculty;
      const response = await authService.login(creds);
      login(response.user, response.token);
      // redirect based on role
      if (response.user.role === 'admin') navigate('/admin/dashboard');
      else if (response.user.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || err?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="bg-white p-8 rounded-lg shadow-premium w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">PSTU</h1>
          <p className="text-gray-600 mt-2">Web Application</p>
        </div>

        {infoMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {infoMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="your@email.com (optional for students)"
              />
            </div>

            {(role === 'student' || role === 'teacher') && (
              <>
                {role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                      <input value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Registration number" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                      <input value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Student ID" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
                  {facultiesError ? (
                    <div className="text-sm text-red-600 px-3 py-2 border border-red-100 rounded-lg">Failed to load faculties: {facultiesError}</div>
                  ) : (
                    <select
                      value={faculty}
                      onChange={e => setFaculty(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      disabled={facultiesLoading}
                    >
                      <option value="">{facultiesLoading ? 'Loading faculties...' : 'Select faculty'}</option>
                      {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                  )}
                </div>
              </>
            )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Don't have an account? <a href="/register" className="text-primary-600 font-medium">Register</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
