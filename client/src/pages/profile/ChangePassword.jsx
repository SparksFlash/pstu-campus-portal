import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { userService } from '../../services/userService';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return alert('Passwords do not match');
    if (newPassword.length < 6) return alert('New password must be at least 6 characters');
    try {
      setLoading(true);
      await userService.changePassword({ currentPassword, newPassword });
      alert('Password changed successfully');
      navigate('/profile');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Change Password</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" placeholder="Current password" className="input" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required />
          <input type="password" placeholder="New password" className="input" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
          <input type="password" placeholder="Confirm new password" className="input" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => navigate('/profile')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading? 'Saving...':'Change Password'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ChangePassword;
