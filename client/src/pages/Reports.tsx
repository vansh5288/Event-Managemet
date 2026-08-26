import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reportsApi, downloadBlob } from '../lib/api';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const reportTypes = [
  { key: 'events', label: 'Events Report', description: 'All events with capacity, status, and registrations' },
  { key: 'registrations', label: 'Registrations Report', description: 'Every registration with attendee and ticket details' },
  { key: 'payments', label: 'Payments Report', description: 'All transactions with gateway and invoice numbers' },
];

export default function Reports() {
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [exporting, setExporting] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['reports-summary'],
    queryFn: () => reportsApi.getSummary(),
  });

  const summary: any = data?.data || {};
  const eventCount = summary.events?.length || 0;
  const registrationCount = summary.registrations?.length || 0;
  const paymentCount = summary.payments?.length || 0;
  const totalRevenue = (summary.payments || []).filter((p: any) => p.status === 'success').reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const endpoint = `/reports/${type}/export?format=${format}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Export failed');
      }
      const blob = await res.blob();
      const ext = format === 'xlsx' ? 'xls' : format;
      downloadBlob(blob, `${type}-report-${Date.now()}.${ext}`);
      toast.success(`${type} report exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to export ${type} report`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and download detailed reports</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="input-field w-auto">
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Events</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? '…' : eventCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Registrations</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? '…' : registrationCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Payments</p>
          <p className="text-2xl font-bold mt-1">{isLoading ? '…' : paymentCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Collected Revenue</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {isLoading ? '…' : totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
        </div>
      </motion.div>

      {error ? (
        <motion.div variants={item} className="text-center py-16 text-gray-400">
          <p className="mb-4">Failed to load report data</p>
          <button className="btn-secondary" onClick={() => refetch()}>Retry</button>
        </motion.div>
      ) : (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <div key={report.key} className="card p-6 flex flex-col">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{report.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {['csv', 'xlsx', 'pdf'].map((f) => (
                    <span
                      key={f}
                      className={`badge ${format === f ? 'badge-primary' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {f.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleExport(report.key)}
                disabled={exporting === report.key}
                className="btn-primary w-full mt-5"
              >
                {exporting === report.key ? 'Exporting…' : 'Download'}
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Live preview table */}
      <motion.div variants={item} className="card p-4">
        <h3 className="font-semibold text-lg mb-4">Recent Payments</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
          </div>
        ) : (summary.payments || []).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No payment data available yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(summary.payments || []).slice(0, 8).map((p: any) => (
                  <tr key={p._id}>
                    <td className="font-medium">{p.invoiceNumber || 'N/A'}</td>
                    <td>{p.user?.name || 'N/A'}</td>
                    <td>{p.event?.title || 'N/A'}</td>
                    <td>{p.currency} {p.amount}</td>
                    <td><span className={`badge ${p.status === 'success' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : p.status === 'refunded' ? 'badge' : 'badge-danger'}`}>{p.status}</span></td>
                    <td className="text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
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

