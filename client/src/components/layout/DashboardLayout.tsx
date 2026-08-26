import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { useAuth } from '../../lib/auth-context';

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  // Track user activity for session
  useEffect(() => {
    const markActive = () => {
      localStorage.setItem('lastActive', new Date().toISOString());
    };
    window.addEventListener('click', markActive);
    window.addEventListener('keydown', markActive);
    return () => {
      window.removeEventListener('click', markActive);
      window.removeEventListener('keydown', markActive);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50/40 to-violet-50">
      <Sidebar />
      <main className="lg:ml-[262px] p-4 md:p-6 pt-16 lg:pt-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <div className="avatar text-sm shrink-0">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

