import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-gray-800/80 border border-gray-700/50',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    elevated: 'bg-gray-800 border border-gray-700/30 shadow-xl shadow-black/20',
    bordered: 'bg-gray-800/40 border-2 border-gray-600/50',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={clsx('rounded-2xl', variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
