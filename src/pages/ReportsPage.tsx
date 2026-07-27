import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, Package, AlertTriangle, CalendarX,
  Download,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { fetchSalesChartData, fetchTopProducts, fetchDashboardStats, fetchProducts } from '@/services/api';
import { formatCurrency, formatNumber, getStockStatus, getExpiryStatus, cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const PIE_COLORS = ['#2563eb', '#0d9488', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#14b8a6', '#f97316'];

type Period = 7 | 30 | 90;

export function ReportsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const [period, setPeriod] = useState<Period>(30);

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['sales-chart', period],
    queryFn: () => fetchSalesChartData(period),
  });
  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ['top-products', period],
    queryFn: () => fetchTopProducts(8),
  });
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });
  const { data: products } = useQuery({
    queryKey: ['products', 'reports'],
    queryFn: () => fetchProducts(),
  });

  const lowStock = products?.filter((p) => p.quantity <= p.min_stock) ?? [];
  const expired = products?.filter((p) => p.expiry_date && getExpiryStatus(p.expiry_date) === 'expired') ?? [];

  const periodLabels: { value: Period; label: string }[] = [
    { value: 7, label: '7 أيام' },
    { value: 30, label: '30 يوم' },
    { value: 90, label: '90 يوم' },
  ];

  return (
    <div>
      <PageHeader
        title="التقارير"
        description="تحليلات ومؤشرات الأداء"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {periodLabels.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  period === p.value
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <SummaryCard title="مبيعات الشهر" value={formatCurrency(stats?.monthSales ?? 0)} icon={<DollarSign className="h-5 w-5" />} color="primary" />
            <SummaryCard title="صافي الأرباح" value={formatCurrency(stats?.totalProfit ?? 0)} icon={<TrendingUp className="h-5 w-5" />} color="success" />
            <SummaryCard title="مخزون منخفض" value={formatNumber(stats?.lowStockCount ?? 0)} icon={<AlertTriangle className="h-5 w-5" />} color="warning" />
            <SummaryCard title="منتهي الصلاحية" value={formatNumber(stats?.expiredCount ?? 0)} icon={<CalendarX className="h-5 w-5" />} color="danger" />
          </>
        )}
      </div>

      {/* Sales trend chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>اتجاه المبيعات والأرباح</CardTitle>
          <Badge variant="primary" dot>تقرير</Badge>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-[350px] w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData ?? []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="rptSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rptProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisColor }} reversed />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} orientation="right" />
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff', border: 'none', borderRadius: '12px' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend />
                <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#2563eb" strokeWidth={2.5} fill="url(#rptSales)" />
                <Area type="monotone" dataKey="profit" name="الأرباح" stroke="#0d9488" strokeWidth={2.5} fill="url(#rptProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top products + category distribution */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أفضل المنتجات مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} />
                  <YAxis type="category" dataKey="product_name" tick={{ fontSize: 10, fill: axisColor }} width={110} orientation="right" />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff', border: 'none', borderRadius: '12px' }} />
                  <Bar dataKey="quantity" name="الكمية" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">لا توجد بيانات</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع المبيعات حسب المنتج</CardTitle>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={topProducts} dataKey="revenue" nameKey="product_name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {topProducts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#111827' : '#fff', border: 'none', borderRadius: '12px' }} formatter={(v) => formatCurrency(Number(v))} />
                  <Legend formatter={(v: string) => <span className="text-xs text-slate-600 dark:text-slate-400">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">لا توجد بيانات</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock + expired tables */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>منتجات مخزون منخفض</CardTitle>
            <Badge variant="warning">{lowStock.length}</Badge>
          </CardHeader>
          <CardContent>
            {lowStock.length > 0 ? (
              <div className="space-y-2">
                {lowStock.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">الحد الأدنى: {p.min_stock}</p>
                      </div>
                    </div>
                    <Badge variant={p.quantity <= 0 ? 'danger' : 'warning'}>{p.quantity} متبقي</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">جميع المنتجات متوفرة بكميات كافية</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>منتجات منتهية الصلاحية</CardTitle>
            <Badge variant="danger">{expired.length}</Badge>
          </CardHeader>
          <CardContent>
            {expired.length > 0 ? (
              <div className="space-y-2">
                {expired.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400">
                        <CalendarX className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">انتهى بتاريخ {p.expiry_date}</p>
                      </div>
                    </div>
                    <Badge variant="danger">منتهي</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">لا توجد منتجات منتهية الصلاحية</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'danger';
}

const colorMap = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  success: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
  danger: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
};

function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardContent className="p-5">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', colorMap[color])}>{icon}</div>
          <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{title}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
