import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Calendar, Users, DollarSign, Activity, CheckCircle2, TrendingUp, Award, Plus,
  MapPin, Clock, Sparkles,
} from 'lucide-react';
import { analyticsApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import StatCard from '../components/ui/StatCard';
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

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = (await analyticsApi.getDashboard()) as { data: any };
        setStats(res.data);
      } catch {
        // Fall back to empty state
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const s = stats?.stats || {};
  const charts = stats?.charts || {};
  const recentRegistrations = stats?.recentRegistrations || [];
  const todaySchedule = stats?.todaySchedule || [];

  const revenueData = (charts.revenueTrend || []).map((d: any) => ({
    month: fmtMonth(d._id),
    revenue: d.total || 0,
  }));
  const registrationData = (charts.registrationTrend || []).map((d: any) => ({
    month: fmtMonth(d._id),
    registrations: d.count || 0,
  }));
  const categoryData: { name: string; value: number }[] = (charts.categoryDistribution || []).map((d: any) => ({
    name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Other',
    value: d.count || 0,
  }));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount || 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your events today.</p>
        </div>
        <Link to="/dashboard/events/create" className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-200">
          <Plus size={16} />
          Create Event
        </Link>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar size={22} />} label="Total Events" value={loading ? '—' : (s.totalEvents ?? 0)} color="#3b82f6" loading={loading} />
        <StatCard icon={<Users size={22} />} label="Total Registrations" value={loading ? '—' : (s.totalRegistrations ?? 0)} color="#8b5cf6" loading={loading} />
        <StatCard icon={<DollarSign size={22} />} label="Revenue" value={loading ? '—' : formatCurrency(s.totalRevenue ?? 0)} color="#10b981" loading={loading} />
        <StatCard icon={<Activity size={22} />} label="Active Events" value={loading ? '—' : (s.activeEvents ?? 0)} color="#06b6d4" loading={loading} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<CheckCircle2 size={20} />} label="Completed" value={loading ? '—' : (s.completedEvents ?? 0)} color="#059669" loading={loading} />
        <StatCard icon={<TrendingUp size={20} />} label="Upcoming" value={loading ? '—' : (s.upcomingEvents ?? 0)} color="#2563eb" loading={loading} />
        <StatCard icon={<Award size={20} />} label="Certificates" value={loading ? '—' : (s.totalCertificates ?? 0)} color="#8b5cf6" loading={loading} />
        <StatCard icon={<Users size={20} />} label="Volunteers" value={loading ? '—' : (s.totalVolunteers ?? 0)} color="#0ea5e9" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-blue-500" /> Revenue Trend
          </h3>
          {loading ? (
            <div className="skeleton h-[280px] w-full rounded-xl" />
          ) : revenueData.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div variants={item} className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-500" /> Registration Trend
          </h3>
          {loading ? (
            <div className="skeleton h-[280px] w-full rounded-xl" />
          ) : registrationData.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No registration data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="registrations" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category distribution */}
        <motion.div variants={item} className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-pink-500" /> Categories
          </h3>
          {loading ? (
            <div className="skeleton h-[220px] w-full rounded-xl" />
          ) : categoryData.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Create events to see categories</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </motion.div>

        {/* Recent registrations */}
        <motion.div variants={item} className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Users size={18} className="text-cyan-500" /> Recent Registrations
          </h3>
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-lg" />)
            ) : recentRegistrations.length > 0 ? (
              recentRegistrations.slice(0, 5).map((reg: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50/50 transition-colors">
                  <div className="avatar text-xs shrink-0">{reg.user?.name?.charAt(0) || 'U'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{reg.user?.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500 truncate">{reg.event?.title}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">No registrations yet</div>
            )}
          </div>
        </motion.div>

        {/* Today's schedule */}
        <motion.div variants={item} className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock size={18} className="text-orange-500" /> Today's Schedule
          </h3>
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-lg" />)
            ) : todaySchedule.length > 0 ? (
              todaySchedule.slice(0, 5).map((event: any, i: number) => (
                <Link
                  key={i}
                  to={`/dashboard/events/${event._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {new Date(event.startDate).getHours()}:00
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-blue-600">{event.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={10} /> {event.location?.city || 'Online'}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">No events scheduled today</div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

