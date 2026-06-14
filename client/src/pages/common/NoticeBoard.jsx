import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Loading from '../../components/shared/Loading';
import { formatDate } from '../../utils/formatters';
import { noticeService } from '../../services/noticeService';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await noticeService.getLatestNotices(10);
        if (mounted) setNotices(res);
      } catch (err) {
        console.error('Failed to load notices, falling back to sample', err);
        if (mounted) setNotices([
          { _id: '1', title: 'Semester 4-1 Classes Starting', content: 'Classes for 4th year 1st semester will start from January 15, 2024.', createdAt: new Date(), createdBy: { name: 'Admin' } },
          { _id: '2', title: 'Grade Submission Deadline', content: 'Teachers must submit final grades by February 28, 2024.', createdAt: new Date(Date.now() - 86400000), createdBy: { name: 'Academic Department' } },
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
        <h1 className="text-3xl font-bold text-gray-900">Notice Board</h1>

        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{notice.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    By {notice.createdBy?.name || 'Admin'} • {formatDate(notice.createdAt)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-gray-700">{notice.content}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default NoticeBoard;
