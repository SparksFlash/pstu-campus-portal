import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    const reason = params.get('reason');
    // If redirected from server verification, show status directly
    if (statusParam) {
      if (statusParam === 'success') {
        setStatus('success');
        setMessage('Email verified successfully');
      } else {
        setStatus('error');
        setMessage(reason ? `Verification failed: ${reason}` : 'Verification failed');
      }
      return;
    }

    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing token');
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/verify?token=${token}`);
        setStatus('success');
        setMessage(res.data?.message || 'Email verified successfully');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      }
    };

    verify();
  }, [location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="bg-white p-8 rounded-lg shadow-premium w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p className={`mb-6 ${status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message}</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/login')} className="btn-primary">Go to Login</button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
