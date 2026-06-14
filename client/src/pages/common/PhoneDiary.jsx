import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import { phoneService } from '../../services/phoneService';

const PhoneDiary = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await phoneService.getAllPhoneEntries();
        if (mounted) setEntries(res);
      } catch (err) {
        console.error('Failed to load phone diary entries, using sample', err);
        if (mounted) setEntries([
          { _id: '1', name: 'Registrar Office', phone: '+880-700-111111', email: 'registrar@pstu.edu.bd', department: 'Administration' },
          { _id: '2', name: 'Academic Department', phone: '+880-700-222222', email: 'academic@pstu.edu.bd', department: 'Academic' },
        ]);
      } finally { if (mounted) setLoading(false); }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading />;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Phone Diary</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <div key={entry._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-gray-900">{entry.name}</h3>
              <p className="text-sm text-gray-600 mt-2">{entry.department}</p>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Phone:</span> {entry.phone}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Email:</span> {entry.email}
                </p>
              </div>

              <button className="w-full mt-4 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition">
                Call Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PhoneDiary;
