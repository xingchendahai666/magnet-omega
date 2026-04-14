'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function GlassCard({ children, className, onClick, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01, y: -2 } : {}}
      whileTap={hover ? { scale: 0.99 } : {}}
      onClick={onClick}
      className={cn(
        'bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-xl',
        hover ? 'hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-500/30 transition-all duration-300' : '',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
