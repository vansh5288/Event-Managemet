import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { eventsApi, registrationsApi } from '../lib/api';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Attendees() {
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const queryClient = useQueryClient();

  const { data: eventsData } = useQuery<any>({
    queryKey: ['events-all'],
    queryFn: () => eventsApi.getAll({ limit: '100' }),
  });

  const events = eventsData?.data || [];

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ['attendees', selectedEvent],
    queryFn: () => {
      if (selectedEvent) return registrationsApi.getByEvent(selectedEvent, { limit: '200' });
      // Fetch registrations for all user events by picking the first few events
      return registrationsApi.getMy();
    },
  });

  const registrations = data?.data || [];

  const checkinMutation = useMutation({
    mutationFn: (id: string) => registrationsApi.checkin(id),
    onSuccess: () => {
      toast.success('Attendee checked in');
      queryClient.invalidateQueries({ queryKey: ['attendees'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Check-in failed'),
  });

  const filtered = registrations.filter((reg: any) => {
    const name = (reg.user?.name || '').toLowerCase();
    const email = (reg.user?.email || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Attendees</h1>
        <p className="text-gray-500 mt-1">Manage event attendees and check-ins</p>
      </motion.div>

      <motion.div variants={item} className="card p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search attendees by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
            />
          </div>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">My Registered Events</option>
            {events.map((ev: any) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={() => refetch()}>Refresh</button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-sm">No attendees found</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Ticket</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg: any) => (
                  <tr key={reg._id}>
                    <td className="font-medium">{reg.user?.name || 'N/A'}</td>
                    <td className="text-gray-500">{reg.user?.email || 'N/A'}</td>
                    <td>{reg.event?.title || 'N/A'}</td>
                    <td>{reg.ticket?.name || 'N/A'}</td>
                    <td>{reg.quantity}</td>
                    <td>
                      <span className={
                        reg.status === 'checked_in' ? 'badge badge-success'
                        : reg.status === 'confirmed' ? 'badge badge-primary'
                        : reg.status === 'pending' ? 'badge badge-warning'
                        : 'badge badge-danger'
                      }>
                        {reg.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {reg.status === 'confirmed' && (
                        <button
                          className="btn-ghost text-sm text-green-600"
                          onClick={() => checkinMutation.mutate(reg._id)}
                        >
                          Check In
                        </button>
                      )}
                      {reg.status === 'pending' && (
                        <span className="text-xs text-gray-400">Awaiting payment</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

