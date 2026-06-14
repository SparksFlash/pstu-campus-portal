import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import { busService } from '../../services/busService';

const BusSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await busService.getAllBusSchedules();
        if (mounted) setSchedules(res);
      } catch (err) {
        console.error('Failed to load bus schedules, using sample', err);
        if (mounted) setSchedules([
          { _id: '1', route: 'Campus - City Center', departure: '08:00 AM', arrival: '08:45 AM', days: 'Mon - Fri', status: 'Active' },
          { _id: '2', route: 'Campus - Railway Station', departure: '02:00 PM', arrival: '02:30 PM', days: 'Daily', status: 'Active' },
        ]);
      } finally { if (mounted) setLoading(false); }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading />;

  const bgUrl = 'http://localhost:5000/assets/pstu_bus.jpg';

  return (
    <Layout>
      <div
        className="space-y-6 p-8 rounded-lg"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="bg-white/80 p-4 rounded">
          <h1 className="text-3xl font-bold text-gray-900">Bus Schedule</h1>

          <div className="overflow-x-auto bg-white rounded-lg shadow-md mt-4">
            <table className="w-full">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Route</th>
                  <th className="px-6 py-3 text-left">Departure</th>
                  <th className="px-6 py-3 text-left">Arrival</th>
                  <th className="px-6 py-3 text-left">Days</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule._id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-3">{schedule.route}</td>
                    <td className="px-6 py-3">{schedule.departure}</td>
                    <td className="px-6 py-3">{schedule.arrival}</td>
                    <td className="px-6 py-3">{schedule.days}</td>
                    <td className="px-6 py-3">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {schedule.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BusSchedule;
