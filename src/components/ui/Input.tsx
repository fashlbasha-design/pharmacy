import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={cn('premium-input', icon && 'pr-10', error && 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20', className)}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'premium-input cursor-pointer appearance-none bg-[length:1.25rem] bg-[left_0.75rem_center] bg-no-repeat pl-9',
            "[background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394a3b8'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")]",
            error && 'border-danger-400',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-border dark:bg-surface-card/60 dark:text-slate-100 dark:placeholder:text-slate-500',
            error && 'border-danger-400',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
