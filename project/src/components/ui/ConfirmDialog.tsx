import { type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  icon?: ReactNode;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger',
  icon,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={
            variant === 'danger'
              ? 'flex h-14 w-14 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-500/15'
              : 'flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/15'
          }
        >
          {icon ?? (
            <AlertTriangle
              className={variant === 'danger' ? 'h-7 w-7 text-danger-600 dark:text-danger-400' : 'h-7 w-7 text-primary-600 dark:text-primary-400'}
            />
          )}
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <div className="mt-6 flex w-full gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
