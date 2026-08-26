import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      {icon ? (
        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-300">
          {icon}
        </div>
      ) : (
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50" />
      )}
      <h3 className="text-lg font-semibold text-gray-600 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

