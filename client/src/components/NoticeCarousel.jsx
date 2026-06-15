import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiBell } from 'react-icons/fi';
import { noticeService } from '../services/noticeService';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NoticeCarousel({ limit = 5 }) {
  const [notices, setNotices] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    noticeService.getLatestNotices(limit)
      .then(res => setNotices(Array.isArray(res) ? res : []))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, [limit]);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % Math.max(notices.length, 1));
  }, [notices.length]);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + notices.length) % Math.max(notices.length, 1));
  }, [notices.length]);

  useEffect(() => {
    if (notices.length < 2 || paused) return;
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [notices.length, paused, next]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
        <div className="h-10 bg-primary-600/80 rounded-t-2xl" />
        <div className="p-6 space-y-3">
          <div className="h-5 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-12 bg-gray-50 rounded" />
        </div>
      </div>
    );
  }

  if (notices.length === 0) return null;

  const notice = notices[current];

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="flex items-center gap-2 text-white">
          <FiBell size={16} />
          <span className="text-sm font-semibold tracking-wide">Latest Notices</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Previous"
          >
            <FiChevronLeft size={17} />
          </button>
          <span className="text-xs text-white/60 font-medium">{current + 1}/{notices.length}</span>
          <button
            onClick={next}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Next"
          >
            <FiChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="overflow-hidden">
        <div
          className="transition-all duration-500 ease-in-out"
          style={{ transform: `translateX(0)` }}
          key={notice._id}
        >
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
              {notice.title}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {fmtDate(notice.createdAt)}
              {notice.createdBy?.name ? ` · ${notice.createdBy.name}` : ''}
            </p>
            <p className="text-sm text-gray-600 mt-2 line-clamp-3 leading-relaxed">
              {notice.content}
            </p>
          </div>
        </div>
      </div>

      {/* Footer: dots + link */}
      <div className="flex items-center justify-between px-5 pb-4">
        <div className="flex gap-1.5">
          {notices.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? 'w-5 h-2 bg-primary-500' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'}`}
              aria-label={`Go to notice ${i + 1}`}
            />
          ))}
        </div>
        <Link
          to="/notices"
          className="text-xs font-medium text-primary-600 hover:text-primary-700 transition"
        >
          View all notices →
        </Link>
      </div>
    </div>
  );
}
