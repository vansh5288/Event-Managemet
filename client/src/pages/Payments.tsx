import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../lib/api';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Payments() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery<any>({
    queryKey: ['payments', status],
    queryFn: () => paymentsApi.getAll(),
  });

  const payments = data?.data || [];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge badge-warning',
      success: 'badge badge-success',
      failed: 'badge badge-danger',
      refunded: 'badge',
    };
    return badges[status] || 'badge';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-gray-500 mt-1">Track payments and transactions</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">$24,500</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Successful</p>
          <p className="text-2xl font-bold text-blue-600">$21,200</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">$3,300</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="card p-4">
        <div className="flex gap-3 mb-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-auto">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button className="btn-secondary">Export CSV</button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect width="20" height="14" x="2" y="5" rx="2"/>
              <line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
            <p className="text-sm">No payments found</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment._id}>
                    <td className="font-medium">{payment.invoiceNumber || 'N/A'}</td>
                    <td>{payment.event?.title || 'N/A'}</td>
                    <td className="font-medium">${payment.amount}</td>
                    <td className="capitalize">{payment.gateway}</td>
                    <td><span className={getStatusBadge(payment.status)}>{payment.status}</span></td>
                    <td className="text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-ghost text-sm">View</button>
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
