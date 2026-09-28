import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'teal';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'blue',
  size = 'md',
  className,
}: BadgeProps) {
  const variants = {
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    yellow: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    red: 'bg-red-500/15 text-red-400 border border-red-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    gray: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
    teal: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md',
    md: 'text-xs px-2.5 py-1 rounded-lg',
  };

  return (
    <span className={clsx('inline-flex items-center font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
