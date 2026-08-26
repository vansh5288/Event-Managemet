import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { registrationsApi } from '../lib/api';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Registrations() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery<any>({
    queryKey: ['registrations', status],
    queryFn: () => registrationsApi.getMy(),
  });

  const registrations = data?.data || [];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge badge-warning',
      confirmed: 'badge badge-primary',
      checked_in: 'badge badge-success',
      cancelled: 'badge badge-danger',
      waitlisted: 'badge',
    };
    return badges[status] || 'badge';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Registrations</h1>
        <p className="text-gray-500 mt-1">View and manage your event registrations</p>
      </motion.div>

      <motion.div variants={item} className="card p-4">
        <div className="flex gap-3 mb-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-auto">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
          <button className="btn-secondary">Export CSV</button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            <p className="text-sm">No registrations found</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Ticket</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg: any) => (
                  <tr key={reg._id}>
                    <td className="font-medium">{reg.event?.title || 'N/A'}</td>
                    <td>{reg.ticket?.name || 'N/A'}</td>
                    <td>{reg.quantity}</td>
                    <td>${reg.totalPrice}</td>
                    <td><span className={getStatusBadge(reg.status)}>{reg.status}</span></td>
                    <td className="text-gray-500">{new Date(reg.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-ghost text-sm">View</button>
                      {reg.status === 'confirmed' && (
                        <button className="btn-ghost text-sm text-red-500">Cancel</button>
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
