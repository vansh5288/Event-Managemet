import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationsApi } from '../lib/api';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const typeColors: Record<string, string> = {
  registration: '#3b82f6',
  payment: '#10b981',
  reminder: '#f59e0b',
  certificate: '#8b5cf6',
  event_update: '#06b6d4',
  general: '#94a3b8',
  chat_message: '#0ea5e9',
};

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
  });

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to mark all as read'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter((n: any) => !n.isRead)
      : notifications.filter((n: any) => n.type === filter);

  const toggleRead = (n: any) => {
    if (!n.isRead) markReadMutation.mutate(n._id);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with your events</p>
        </div>
        <div className="flex gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All ({notifications.length})</option>
            <option value="unread">Unread ({unreadCount})</option>
            <option value="registration">Registrations</option>
            <option value="payment">Payments</option>
            <option value="reminder">Reminders</option>
            <option value="certificate">Certificates</option>
            <option value="event_update">Event Updates</option>
          </select>
          <button className="btn-secondary" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            Mark All Read
          </button>
        </div>
      </motion.div>

      <motion.div variants={item} className="card p-4 space-y-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          filtered.map((notif: any) => (
            <div
              key={notif._id}
              onClick={() => toggleRead(notif)}
              className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                notif.isRead ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: typeColors[notif.type] || '#94a3b8' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h4 className={`text-sm truncate ${notif.isRead ? 'font-medium' : 'font-semibold'}`}>{notif.title}</h4>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(notif.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
              </div>
              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
              <button
                onClick={(e) => { e.stopPropagation(); removeMutation.mutate(notif._id); }}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                title="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}

