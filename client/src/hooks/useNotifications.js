import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './useAuth';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export function useNotifications() {
  const { user, token }         = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const esRef                             = useRef(null);

  // Fetch initial list
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get('/notifications');
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.isRead).length);
    } catch {
      // silent — non-critical
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // SSE connection
  useEffect(() => {
    if (!user || !token) return;

    const url = `${BASE_URL}/notifications/stream`;
    const es  = new EventSource(`${url}?token=${token}`);
    esRef.current = es;

    es.addEventListener('notification', (e) => {
      try {
        const n = JSON.parse(e.data);
        setNotifications(prev => [n, ...prev]);
        setUnreadCount(c => c + 1);
      } catch {}
    });

    es.onerror = () => {
      // Browser auto-reconnects on error — no action needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [user, token]);

  const markRead = useCallback(async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const remove = useCallback(async (id) => {
    const wasUnread = notifications.find(n => n._id === id)?.isRead === false;
    await api.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
  }, [notifications]);

  return { notifications, unreadCount, loading, markRead, markAllRead, remove, refetch: fetchNotifications };
}
