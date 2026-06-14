import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  if (isAuthenticated) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-lg shadow-lg">
            <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}!</h1>
            <p className="text-lg opacity-90">
              {user?.role === 'admin' && 'Manage the entire system from here'}
              {user?.role === 'teacher' && 'Manage grades and students'}
              {user?.role === 'student' && 'View your academic progress'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Stats</h3>
              <p className="text-3xl font-bold text-primary-600">
                {user?.role === 'student' ? 'GPA' : 'Active Users'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Recent Activity</h3>
              <p className="text-gray-600">No recent activity</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Notifications</h3>
              <p className="text-gray-600">0 new notifications</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <div className="text-center text-white max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">PSTU Web Application</h1>
        <p className="text-xl mb-8 opacity-90">
          Patuakhali Science and Technology University - Educational Management System
        </p>
        <button
          onClick={handleGetStarted}
          className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Home;
