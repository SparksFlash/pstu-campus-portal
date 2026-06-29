import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../../services/authService';
import { facultyService } from '../../services/facultyService';
import { validateEmail, validatePassword } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { semesterLabel } from '../../utils/formatters';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [faculty, setFaculty] = useState('');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('Creating account...');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await authService.googleAuth(credentialResponse.credential);
      login(response.user, response.token);
      if (response.user.role === 'admin') navigate('/admin/dashboard');
      else if (response.user.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Name is required');
    if (!validateEmail(email)) return setError('Please enter a valid email');
    if (!validatePassword(password)) return setError('Password must be at least 6 characters');

    // require faculty for teachers
    if (role === 'teacher' && !faculty) return setError('Please select a faculty');
    if (role === 'student' && !semester) return setError('Please select your current semester');

    setLoading(true);
    setLoadingMsg('Creating account...');
    const msgTimer = setTimeout(() => setLoadingMsg('Server is starting up, please wait...'), 8000);
    try {
      const payload = { name, email, password, role, faculty };
      if (role === 'student') {
        if (!registrationNumber && !studentId) return setError('Students must provide registration number or student ID');
        if (registrationNumber) payload.registrationNumber = registrationNumber;
        if (studentId) payload.studentId = studentId;
        payload.semester = parseInt(semester);
      }
      const res = await authService.register(payload);
      clearTimeout(msgTimer);
      setLoading(false);
      const msg = res?.message || res?.data?.message || 'Registration successful!';
      navigate('/login', { state: { info: msg } });
      return;
    } catch (err) {
      clearTimeout(msgTimer);
      const msg = err?.message || err?.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      clearTimeout(msgTimer);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let mounted = true;
    const loadFac = async () => {
      try {
        const f = await facultyService.getAllFaculties();
        if (!mounted) return;
        setFaculties(f || []);
      } catch (err) {
        // ignore
      }
    };
    loadFac();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="bg-white p-8 rounded-lg shadow-premium w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Register</h1>
          <p className="text-gray-600 mt-2">Create an account to access PSTU services</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {verifyUrl && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Verification link (development):</p>
            <a href={verifyUrl} target="_blank" rel="noreferrer" className="text-primary-600 underline break-all">
              {verifyUrl}
            </a>
            <div className="mt-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(verifyUrl);
                }}
                className="mt-2 inline-block bg-primary-600 text-white py-1 px-3 rounded text-sm"
              >
                Copy link
              </button>
              <button
                onClick={() => navigate('/login')}
                className="mt-2 ml-2 inline-block bg-gray-200 text-gray-800 py-1 px-3 rounded text-sm"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                <input value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Registration number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student ID <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Student ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
                <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{semesterLabel(s)}</option>)}
                </select>
              </div>
            </>
          )}

          {(role === 'student' || role === 'teacher') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
              <select value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Select faculty</option>
                {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Choose a strong password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? loadingMsg : 'Register'}
          </button>
        </form>
        {process.env.REACT_APP_GOOGLE_CLIENT_ID && (
          <div className="mt-5">
            <div className="relative flex items-center my-3">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-3 text-sm text-gray-400">or sign up with</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                useOneTap={false}
                text="signup_with"
                shape="rectangular"
                width="360"
              />
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Google sign-up creates a student account. You can update your profile after sign-in.</p>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Already have an account? <a href="/login" className="text-primary-600 font-medium">Login</a></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
