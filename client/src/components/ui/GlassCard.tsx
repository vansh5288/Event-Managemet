import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
}

export const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

export const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export default function GlassCard({
  children,
  className = '',
  hover = true,
  delay = 0,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      variants={item}
      custom={delay}
      initial="hidden"
      animate="show"
      className={`card ${hover ? 'card-hover-glow' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      whileHover={onClick ? { y: -4 } : undefined}
    >
      {children}
    </motion.div>
  );
}

