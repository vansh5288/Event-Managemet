import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Eye, TrendingUp, Users, MousePointerClick } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { analyticsApi } from '../lib/api';
import { container, item } from '../components/ui/GlassCard';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#0ea5e9'];

const fmtMonth = (m: string) => {
  if (!m) return '';
  try {
    const [y, mon] = m.split('-');
    return new Date(Number(y), Number(mon) - 1, 1).toLocaleString('en', { month: 'short' });
  } catch {
    return m;
  }
};

export default function Analytics() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
  });

  const dashboard = (data as any)?.data;
  const stats = dashboard?.stats || {};
  const charts = dashboard?.charts || {};

  const revenueTrend = (charts.revenueTrend || []).map((d: any) => ({
    month: fmtMonth(d._id),
    revenue: d.total || 0,
  }));
  const registrationTrend = (charts.registrationTrend || []).map((d: any) => ({
    month: fmtMonth(d._id),
    registrations: d.count || 0,
  }));
  const categoryData: { name: string; value: number }[] = (charts.categoryDistribution || []).map((d: any) => ({
    name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Other',
    value: d.count || 0,
  }));
  const eventGrowth = (charts.eventGrowth || []).map((d: any) => ({
    month: fmtMonth(d._id),
    events: d.count || 0,
  }));

  // Merge monthly revenue and registrations for comparison chart
  const mergedTrend = revenueTrend.map((r: any) => ({
    ...r,
    registrations: registrationTrend.find((x: any) => x.month === r.month)?.registrations || 0,
  }));

  const totalRevenue = stats.totalRevenue ?? 0;
  const totalRegistrations = stats.totalRegistrations ?? 0;
  const checkInRate = stats.checkInRate ?? 0;
  const eventsCount = stats.totalEvents ?? 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Detailed analytics and insights from your events"
      />

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Eye size={20} />} label="Total Events" value={eventsCount} color="#3b82f6" />
          <StatCard icon={<TrendingUp size={20} />} label="Total Revenue" value={`$${(totalRevenue).toLocaleString()}`} color="#10b981" />
          <StatCard icon={<Users size={20} />} label="Registrations" value={totalRegistrations.toLocaleString()} color="#8b5cf6" />
          <StatCard icon={<MousePointerClick size={20} />} label="Check-in Rate" value={`${checkInRate}%`} color="#f59e0b" />
        </div>
      )}

      {error ? (
        <EmptyState
          icon={<TrendingUp size={32} />}
          title="Failed to load analytics"
          description={(error as any)?.message || 'Something went wrong'}
          action={<button className="btn btn-secondary btn-sm mt-2" onClick={() => refetch()}>Retry</button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <motion.div variants={item} className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Revenue Trend</h3>
              {isLoading ? (
                <div className="skeleton h-[300px] w-full rounded-xl" />
              ) : revenueTrend.length === 0 ? (
                <EmptyState title="No revenue data" description="Payments will appear here once attendees purchase tickets." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Registration vs Event Growth */}
            <motion.div variants={item} className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Registration Growth</h3>
              {isLoading ? (
                <div className="skeleton h-[300px] w-full rounded-xl" />
              ) : registrationTrend.length === 0 ? (
                <EmptyState title="No registration data" description="Registrations will appear here once attendees sign up." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mergedTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="registrations" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Growth */}
            <motion.div variants={item} className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Event Growth</h3>
              {isLoading ? (
                <div className="skeleton h-[300px] w-full rounded-xl" />
              ) : eventGrowth.length === 0 ? (
                <EmptyState title="No event growth data" description="Your events will appear here over time." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={eventGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Category Distribution */}
            <motion.div variants={item} className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Category Distribution</h3>
              {isLoading ? (
                <div className="skeleton h-[300px] w-full rounded-xl" />
              ) : categoryData.length === 0 ? (
                <EmptyState title="No category data" description="Create events to see category distribution." />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

