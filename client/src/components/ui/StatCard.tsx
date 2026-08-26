import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  icon,
  label,
  value,
  color = '#3b82f6',
  subtitle,
  loading,
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' } : undefined}
      onClick={onClick}
      className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, color }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          {loading ? (
            <>
              <div className="skeleton h-7 w-20 mb-1" />
              <div className="skeleton h-4 w-24" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold truncate">{value}</div>
              <div className="text-sm text-gray-500 truncate">{label}</div>
              {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

