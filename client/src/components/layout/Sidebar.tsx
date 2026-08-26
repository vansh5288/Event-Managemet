import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  ClipboardList,
  Ticket,
  MapPin,
  CreditCard,
  Handshake,
  HeartHandshake,
  Award,
  BarChart3,
  FileText,
  Bell,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu,
  Wallet,
  BadgePercent,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { notificationsApi } from '../../lib/api';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['all'] },
  { icon: Calendar, label: 'Events', path: '/dashboard/events', roles: ['all'] },
  { icon: CalendarDays, label: 'Calendar', path: '/dashboard/calendar', roles: ['all'] },
  { icon: Users, label: 'Attendees', path: '/dashboard/attendees', roles: ['all'] },
  { icon: ClipboardList, label: 'Registrations', path: '/dashboard/registrations', roles: ['all'] },
  { icon: Ticket, label: 'Tickets', path: '/dashboard/tickets', roles: ['all'] },
  { icon: MapPin, label: 'Venues', path: '/dashboard/venues', roles: ['all'] },
  { icon: CreditCard, label: 'Payments', path: '/dashboard/payments', roles: ['all'] },
  { icon: Wallet, label: 'Wallet', path: '/dashboard/wallet', roles: ['all'] },
  { icon: BadgePercent, label: 'Coupons', path: '/dashboard/coupons', roles: ['admin', 'organizer'] },
  { icon: Handshake, label: 'Sponsors', path: '/dashboard/sponsors', roles: ['all'] },
  { icon: HeartHandshake, label: 'Volunteers', path: '/dashboard/volunteers', roles: ['all'] },
  { icon: Award, label: 'Certificates', path: '/dashboard/certificates', roles: ['all'] },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics', roles: ['all'] },
  { icon: FileText, label: 'Reports', path: '/dashboard/reports', roles: ['all'] },
  { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', roles: ['all'] },
  { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat', roles: ['all'] },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings', roles: ['all'] },
  { icon: User, label: 'Profile', path: '/dashboard/profile', roles: ['all'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unreadCount = (unreadData as any)?.data?.count ?? 0;

  const filteredItems = menuItems.filter(
    (item) => item.roles.includes('all') || (user && item.roles.includes(user.role))
  );

  const sidebarContent = (
    <>
      <div className="p-4 flex items-center gap-3 border-b border-blue-100/40">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md shadow-blue-200">
          E
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"
          >
            EventHub
          </motion.span>
        )}
        <button
          className="lg:hidden ml-auto text-gray-400 hover:text-gray-600"
          onClick={() => setMobileOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} relative`
            }
          >
            <item.icon />
            {!collapsed && <span>{item.label}</span>}
            {item.path === '/dashboard/notifications' && unreadCount > 0 && (
              <span className="ml-auto bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-blue-100/40">
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/60">
            <div className="avatar text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
              </div>
            )}
          </div>
        )}
        <button onClick={logout} className="sidebar-link w-full mt-2 text-rose-500 hover:bg-rose-50">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Collapse toggle for desktop */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex fixed left-[258px] top-4 z-[60] w-8 h-8 rounded-full bg-white border border-blue-100 shadow-md items-center justify-center text-gray-500 hover:text-blue-600 transition-all"
        style={{ left: collapsed ? 60 : 258 }}
        aria-label="Toggle sidebar"
      >
        <Menu size={16} />
      </button>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 262 }}
        className="hidden lg:flex h-screen fixed left-0 top-0 z-50 glass border-r border-white/30 flex-col"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          className="lg:hidden h-screen fixed left-0 top-0 z-50 w-[280px] glass border-r border-white/30 flex flex-col"
        >
          {sidebarContent}
        </motion.aside>
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl glass flex items-center justify-center text-blue-600 shadow-md"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
    </>
  );
}

