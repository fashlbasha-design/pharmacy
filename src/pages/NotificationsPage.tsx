import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bell, BellOff, Trash2, CheckCheck, Package, AlertTriangle, CalendarX, ShoppingCart, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState } from 'react';
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification,
} from '@/services/api';
import { formatDateTime, cn } from '@/lib/utils';
import type { Notification } from '@/types';

const typeConfig: Record<string, { icon: typeof Package; color: string; bg: string }> = {
  low_stock: { icon: AlertTriangle, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-100 dark:bg-warning-900/30' },
  out_of_stock: { icon: AlertTriangle, color: 'text-danger-600 dark:text-danger-400', bg: 'bg-danger-100 dark:bg-danger-900/30' },
  expired: { icon: CalendarX, color: 'text-danger-600 dark:text-danger-400', bg: 'bg-danger-100 dark:bg-danger-900/30' },
  near_expiry: { icon: AlertTriangle, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-100 dark:bg-warning-900/30' },
  new_sale: { icon: ShoppingCart, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  new_product: { icon: Plus, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30' },
};

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => fetchNotifications(),
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('تم تعليم الكل كمقروء');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNotification(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setDeleteTarget(null);
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="الإشعارات"
        description={unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'كل الإشعارات مقروءة'}
        icon={<Bell className="h-5 w-5" />}
        actions={unreadCount > 0 && <Button variant="outline" onClick={handleMarkAll}><CheckCheck className="h-4 w-4" />تعليم الكل كمقروء</Button>}
      />

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif, i) => {
            const config = typeConfig[notif.type] ?? typeConfig.new_sale;
            const Icon = config.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card className={cn(!notif.is_read && 'ring-1 ring-primary-200 dark:ring-primary-800')}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', config.bg)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{notif.title}</p>
                        {!notif.is_read && <Badge variant="primary" dot>جديد</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{notif.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(notif.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
                          title="تعليم كمقروء"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(notif)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <BellOff className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm">لا توجد إشعارات</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الإشعار"
        message="هل أنت متأكد من حذف هذا الإشعار؟"
        confirmText="نعم، حذف"
        loading={deleting}
      />
    </div>
  );
}
