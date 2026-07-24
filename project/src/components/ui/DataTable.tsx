import { type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onRowClick?: (row: T) => void;
  emptyIcon?: ReactNode;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onRowClick,
  emptyIcon,
  emptyMessage = 'لا توجد بيانات',
  actions,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-surface-border dark:bg-surface-card">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-surface-border dark:bg-surface/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400', col.className)}
                >
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">إجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-surface-border/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <div className="skeleton h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                  {actions && <td className="px-4 py-4"><div className="skeleton h-4 w-16" /></td>}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <EmptyState icon={emptyIcon} title={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors hover:bg-slate-50 dark:hover:bg-surface-hover/50',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3.5 text-slate-700 dark:text-slate-300', col.className)}>
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-surface-border sm:flex-row">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            عرض <span className="font-medium text-slate-700 dark:text-slate-300">{start}</span> إلى{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{end}</span> من{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <PageNumbers page={page} totalPages={totalPages} onPageChange={onPageChange} />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PageNumbers({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  const pages: (number | '...')[] = [];
  if (totalPages <= 5 + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const s = Math.max(2, page - 1);
    const e = Math.min(totalPages - 1, page + 1);
    for (let i = s; i <= e; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center gap-1">
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d-${i}`} className="px-2 text-slate-400">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={
              p === page
                ? 'h-8 min-w-8 rounded-lg bg-primary-600 px-2 text-sm font-medium text-white'
                : 'h-8 min-w-8 rounded-lg px-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-surface-hover'
            }
          >
            {p}
          </button>
        ),
      )}
    </div>
  );
}
