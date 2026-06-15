import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import { userService } from '../../services/userService';
import { facultyService } from '../../services/facultyService';
import { useAuth } from '../../hooks/useAuth';

const Profile = () => {
  const { setUser } = useAuth();
  const [form, setForm] = useState({});
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await userService.getUserProfile();
        const f = await facultyService.getAllFaculties();
        if (!mounted) return;
        setForm({
          name: res.user.name || '',
          phone: res.user.phone || '',
          address: res.user.address || '',
          dateOfBirth: res.user.dateOfBirth ? res.user.dateOfBirth.slice(0,10) : '',
          registrationNumber: res.user.registrationNumber || '',
          employeeId: res.user.employeeId || '',
          faculty: res.user.faculty?._id || res.user.faculty || '',
          profilePicture: res.user.profilePicture || '',
        });
        setFaculties(f || []);
        setAvatarPreview(res.user.profilePicture || '');
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const res = await userService.updateUserProfile(form);
      // update auth context and localStorage
      setUser(res.user);
      localStorage.setItem('user', JSON.stringify(res.user));
      alert('Profile updated');
    } catch (err) {
      console.error('Update failed', err);
      alert(err?.message || err?.response?.data?.message || 'Update failed');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setUploading(true);
      const res = await userService.uploadProfilePhoto(formData, (ev) => {
        // could show progress if desired
      });
      const updated = res.user;
      setAvatarPreview(res.url || updated.profilePicture || '');
      setForm(prev => ({ ...prev, profilePicture: res.url || updated.profilePicture }));
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      alert('Profile photo updated');
    } catch (err) {
      console.error('Upload failed', err);
      alert(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No photo</div>
              )}
            </div>
            <div>
              <label className="btn-secondary cursor-pointer">
                {uploading ? 'Uploading...' : 'Change Photo'}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>
          <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Full name" />
          <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="Phone" />
          <input name="address" value={form.address} onChange={handleChange} className="input" placeholder="Address" />
          <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className="input" placeholder="Date of birth" type="date" />
          <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} className="input" placeholder="Registration number" />
          <input name="employeeId" value={form.employeeId} onChange={handleChange} className="input" placeholder="Employee ID" />
          <select name="faculty" value={form.faculty} onChange={handleChange} className="input">
            <option value="">Select faculty (if applicable)</option>
            {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <div className="flex justify-between items-center mt-3">
            <div>
              <button className="btn-secondary mr-2" onClick={() => window.location.reload()}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save</button>
            </div>
            <div>
              <a href="/profile/change-password" className="text-sm text-primary-600 hover:underline">Change password</a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
