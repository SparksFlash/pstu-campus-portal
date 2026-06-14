import React, { useRef, useEffect } from 'react';
import { FiBell, FiX, FiCheck, FiCheckSquare, FiAward, FiBriefcase } from 'react-icons/fi';
import { useNotifications } from '../hooks/useNotifications';
import { formatDateTime } from '../utils/formatters';

const TYPE_META = {
  result_published:   { icon: FiAward,       color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20'  },
  result_unpublished: { icon: FiBriefcase,   color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20'  },
  notice_created:     { icon: FiBell,        color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20'   },
  general:            { icon: FiBell,        color: 'text-gray-400',   bg: 'bg-gray-50 dark:bg-gray-700'      },
};

function NotifIcon({ type }) {
  const meta = TYPE_META[type] || TYPE_META.general;
  const Icon = meta.icon;
  return (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${meta.bg}`}>
      <Icon size={15} className={meta.color} />
    </div>
  );
}

export default function NotificationCenter({ open, onClose }) {
  const { notifications, unreadCount, loading, markRead, markAllRead, remove } = useNotifications();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              title="Mark all as read"
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition"
            >
              <FiCheckSquare size={13} /> All read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FiX size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading && (
          <div className="p-6 text-center text-sm text-gray-400">Loading…</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="p-8 text-center">
            <FiBell size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        )}

        {!loading && notifications.map((n) => (
          <div
            key={n._id}
            className={`flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition ${
              !n.isRead ? 'bg-primary-50/60 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
            }`}
          >
            <NotifIcon type={n.type} />

            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                {n.title}
              </p>
              {n.body && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
              )}
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                {formatDateTime(n.createdAt)}
              </p>
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              {!n.isRead && (
                <button
                  onClick={() => markRead(n._id)}
                  title="Mark as read"
                  className="p-1 rounded text-gray-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
                >
                  <FiCheck size={13} />
                </button>
              )}
              <button
                onClick={() => remove(n._id)}
                title="Delete"
                className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <FiX size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400">{notifications.length} notification{notifications.length !== 1 ? 's' : ''} total</p>
        </div>
      )}
    </div>
  );
}
