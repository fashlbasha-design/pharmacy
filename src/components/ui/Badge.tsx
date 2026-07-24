import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

const variants: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400',
  secondary: 'bg-secondary-50 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400',
  success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
