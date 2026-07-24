import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Warehouse, Package, AlertTriangle, CalendarX, Clock, Search,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { fetchProducts } from '@/services/api';
import { formatCurrency, formatDate, getStockStatus, getExpiryStatus, getDaysUntilExpiry, cn } from '@/lib/utils';
import type { Product } from '@/types';

type Tab = 'all' | 'low' | 'expired' | 'near_expiry';

export function InventoryPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'inventory'],
    queryFn: () => fetchProducts(),
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (tab === 'low') {
      result = result.filter((p) => p.quantity <= p.min_stock);
    } else if (tab === 'expired') {
      result = result.filter((p) => p.expiry_date && getExpiryStatus(p.expiry_date) === 'expired');
    } else if (tab === 'near_expiry') {
      result = result.filter((p) => p.expiry_date && ['critical', 'warning'].includes(getExpiryStatus(p.expiry_date)));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.scientific_name ?? '').toLowerCase().includes(q));
    }
    return result;
  }, [products, tab, search]);

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const tabs = [
    { id: 'all' as const, label: 'كل المنتجات', icon: Package, count: products?.length ?? 0 },
    { id: 'low' as const, label: 'مخزون منخفض', icon: AlertTriangle, count: products?.filter((p) => p.quantity <= p.min_stock).length ?? 0 },
    { id: 'expired' as const, label: 'منتهي الصلاحية', icon: CalendarX, count: products?.filter((p) => p.expiry_date && getExpiryStatus(p.expiry_date) === 'expired').length ?? 0 },
    { id: 'near_expiry' as const, label: 'قرب الانتهاء', icon: Clock, count: products?.filter((p) => p.expiry_date && ['critical', 'warning'].includes(getExpiryStatus(p.expiry_date))).length ?? 0 },
  ];

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'المنتج',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full rounded-lg object-cover" /> : <Package className="h-5 w-5 text-slate-400" />}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.manufacturer}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'الكمية',
      render: (p) => {
        const status = getStockStatus(p.quantity, p.min_stock);
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{p.quantity}</span>
            <span className="text-xs text-slate-400">/ {p.min_stock} حد أدنى</span>
            <Badge variant={status === 'out' ? 'danger' : status === 'low' ? 'warning' : 'success'} dot>
              {status === 'out' ? 'نفد' : status === 'low' ? 'منخفض' : 'متوفر'}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'storage_location',
      header: 'الموقع',
      render: (p) => <span className="text-sm text-slate-600 dark:text-slate-400">{p.storage_location ?? '—'}</span>,
    },
    {
      key: 'expiry_date',
      header: 'تاريخ الانتهاء',
      render: (p) => {
        if (!p.expiry_date) return <span className="text-slate-400">—</span>;
        const status = getExpiryStatus(p.expiry_date);
        const days = getDaysUntilExpiry(p.expiry_date);
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(p.expiry_date)}</span>
            <Badge variant={status === 'expired' ? 'danger' : status === 'critical' ? 'warning' : status === 'warning' ? 'info' : 'success'}>
              {status === 'expired' ? 'منتهي' : days <= 30 ? `${days} يوم متبقي` : days <= 90 ? `${days} يوم` : 'سليم'}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'sale_price',
      header: 'السعر',
      render: (p) => <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(p.sale_price)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="المخزون"
        description="إدارة وتتبع مخزون الأدوية"
        icon={<Warehouse className="h-5 w-5" />}
      />

      {/* Alert cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tabs.map((t) => (
          <Card key={t.id} className={cn(
            'cursor-pointer transition-all',
            tab === t.id ? 'ring-2 ring-primary-500' : 'hover:shadow-card',
          )}>
            <button onClick={() => { setTab(t.id); setPage(1); }} className="w-full p-4 text-right">
              <div className="flex items-center justify-between">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  t.id === 'all' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : t.id === 'low' ? 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
                  : t.id === 'expired' ? 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'
                  : 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
                )}>
                  <t.icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.count}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.label}</p>
            </button>
          </Card>
        ))}
      </div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pr-9 pl-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </motion.div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="لا توجد منتجات"
      />
    </div>
  );
}
