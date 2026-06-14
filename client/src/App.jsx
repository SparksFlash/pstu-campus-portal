import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import CommandPalette from './components/CommandPalette';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import Students from './pages/teacher/Students';
import CourseGrading from './pages/teacher/CourseGrading';
import TeacherWorkflow from './pages/teacher/TeacherWorkflow';
import ResultPublish from './pages/teacher/ResultPublish';
import BulkCSVImport from './pages/teacher/BulkCSVImport';
import StudentResults from './pages/student/StudentResults';
import CourseEnrollment from './pages/student/CourseEnrollment';
import NoticeBoard from './pages/common/NoticeBoard';
import BusSchedule from './pages/common/BusSchedule';
import PhoneDiary from './pages/common/PhoneDiary';
import CourseManagement from './pages/admin/CourseManagement';
import UserManagement from './pages/admin/UserManagement';
import FacultyManagement from './pages/admin/FacultyManagement';
import AuditLog from './pages/admin/AuditLog';
import PaymentGateway from './pages/student/PaymentGateway';
import PaymentHistory from './pages/student/PaymentHistory';
import PaymentSuccess from './pages/student/PaymentSuccess';
import PaymentFail from './pages/student/PaymentFail';
import PaymentDashboard from './pages/admin/PaymentDashboard';
import Profile from './pages/profile/Profile';
import ChangePassword from './pages/profile/ChangePassword';

// Styles
import './index.css';
import './styles/components.css';
import './styles/responsive.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<VerifyEmail />} />

              {/* Admin routes */}
              <Route path="/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute requiredRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/courses"   element={<ProtectedRoute requiredRoles={['admin']}><CourseManagement /></ProtectedRoute>} />
              <Route path="/admin/users"     element={<ProtectedRoute requiredRoles={['admin']}><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/faculties" element={<ProtectedRoute requiredRoles={['admin']}><FacultyManagement /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute requiredRoles={['admin']}><AuditLog /></ProtectedRoute>} />
              <Route path="/admin/payments"  element={<ProtectedRoute requiredRoles={['admin']}><PaymentDashboard /></ProtectedRoute>} />

              {/* Teacher routes */}
              <Route path="/teacher/dashboard" element={<ProtectedRoute requiredRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/students"  element={<ProtectedRoute requiredRoles={['teacher']}><Students /></ProtectedRoute>} />
              <Route path="/teacher/grading"   element={<ProtectedRoute requiredRoles={['teacher']}><CourseGrading /></ProtectedRoute>} />
              <Route path="/teacher/workflow"     element={<ProtectedRoute requiredRoles={['teacher']}><TeacherWorkflow /></ProtectedRoute>} />
              <Route path="/teacher/publish"      element={<ProtectedRoute requiredRoles={['teacher']}><ResultPublish /></ProtectedRoute>} />
              <Route path="/teacher/bulk-import"  element={<ProtectedRoute requiredRoles={['teacher']}><BulkCSVImport /></ProtectedRoute>} />

              {/* Student routes */}
              <Route path="/student/dashboard" element={<ProtectedRoute requiredRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/results"      element={<ProtectedRoute requiredRoles={['student']}><StudentResults /></ProtectedRoute>} />
              <Route path="/student/enrollments"      element={<ProtectedRoute requiredRoles={['student']}><CourseEnrollment /></ProtectedRoute>} />
              <Route path="/student/payments"         element={<ProtectedRoute requiredRoles={['student']}><PaymentGateway /></ProtectedRoute>} />
              <Route path="/student/payments/history" element={<ProtectedRoute requiredRoles={['student']}><PaymentHistory /></ProtectedRoute>} />
              {/* Payment callback landing pages — no auth wrapper, accessed via browser redirect */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/fail"    element={<PaymentFail />} />
              <Route path="/payment/cancel"  element={<PaymentFail />} />

              {/* Common protected routes */}
              <Route path="/notices"       element={<ProtectedRoute><NoticeBoard /></ProtectedRoute>} />
              <Route path="/bus-schedule"  element={<ProtectedRoute><BusSchedule /></ProtectedRoute>} />
              <Route path="/phone-diary"   element={<ProtectedRoute><PhoneDiary /></ProtectedRoute>} />
              <Route path="/profile"               element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Command palette — globally available, Cmd+K to open */}
            <CommandPalette />

            {/* Global toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={3500}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
