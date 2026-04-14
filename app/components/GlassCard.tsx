'use client';

import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassCard({ 
  children, 
  className, 
  onClick, 
  hover = true, 
  glow = false,
  ...props 
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.015, y: -3 } : {}}
      whileTap={hover ? { scale: 0.99 } : {}}
      onClick={onClick}
      className={cn(
        'relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-xl overflow-hidden',
        hover ? 'hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-500/30 transition-all duration-300' : '',
        glow ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/0 before:via-blue-500/10 before:to-purple-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none' : '',
        className
      )}
      role={onClick ? 'button' : 'group'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
