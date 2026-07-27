import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Package, Users, FileText, AlertTriangle,
  CalendarDays, ArrowUpRight, ShoppingCart, DollarSign, Receipt,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchDashboardStats, fetchSalesChartData, fetchTopProducts, fetchRecentSales } from '@/services/api';
import { formatCurrency, formatNumber, formatDateTime, cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const PIE_COLORS = ['#2563eb', '#0d9488', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9'];

export function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipBg = isDark ? '#1E293B' : '#ffffff';

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['sales-chart', 30],
    queryFn: () => fetchSalesChartData(30),
  });
  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => fetchTopProducts(5),
  });
  const { data: recentSales, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => fetchRecentSales(5),
  });

  return (
    <div>
      <PageHeader title="لوحة التحكم" description="نظرة عامة على أداء الصيدلية" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="مبيعات اليوم" value={formatCurrency(stats?.todaySales ?? 0)} icon={<DollarSign className="h-5 w-5" />} color="primary" trend="+12%" trendUp />
            <StatCard title="مبيعات الشهر" value={formatCurrency(stats?.monthSales ?? 0)} icon={<CalendarDays className="h-5 w-5" />} color="secondary" trend="+8%" trendUp />
            <StatCard title="إجمالي الأرباح" value={formatCurrency(stats?.totalProfit ?? 0)} icon={<TrendingUp className="h-5 w-5" />} color="success" trend="+15%" trendUp />
            <StatCard title="عدد الفواتير" value={formatNumber(stats?.totalInvoices ?? 0)} icon={<Receipt className="h-5 w-5" />} color="info" />
          </>
        )}
      </div>

      {/* Secondary stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MiniStat label="المنتجات" value={formatNumber(stats?.totalProducts ?? 0)} icon={<Package className="h-4 w-4" />} onClick={() => navigate('/products')} />
            <MiniStat label="العملاء" value={formatNumber(stats?.totalCustomers ?? 0)} icon={<Users className="h-4 w-4" />} onClick={() => navigate('/customers')} />
            <MiniStat label="مخزون منخفض" value={formatNumber(stats?.lowStockCount ?? 0)} icon={<AlertTriangle className="h-4 w-4" />} variant="warning" onClick={() => navigate('/inventory')} />
            <MiniStat label="منتجات منتهية" value={formatNumber(stats?.expiredCount ?? 0)} icon={<AlertTriangle className="h-4 w-4" />} variant="danger" onClick={() => navigate('/inventory')} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>المبيعات والأرباح</CardTitle>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">آخر 30 يوم</p>
            </div>
            <Badge variant="primary" dot>يومي</Badge>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData ?? []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisColor }} interval={6} reversed />
                  <YAxis tick={{ fontSize: 11, fill: axisColor }} orientation="right" />
                  <Tooltip
                    contentStyle={{ backgroundColor: tooltipBg, border: 'none', borderRadius: '12px', boxShadow: '0 4px 24px -4px rgba(0,0,0,0.2)' }}
                    labelStyle={{ color: isDark ? '#e2e8f0' : '#334155' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#2563eb" strokeWidth={2.5} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" name="الأرباح" stroke="#0d9488" strokeWidth={2.5} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أفضل المنتجات</CardTitle>
            <Badge variant="info" dot>مبيعاً</Badge>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={topProducts} dataKey="quantity" nameKey="product_name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {topProducts.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: 'none', borderRadius: '12px' }} />
                  <Legend formatter={(value: string) => <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<Package className="h-8 w-8" />} title="لا توجد بيانات" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent sales + top products bar */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>آخر عمليات البيع</CardTitle>
            <button onClick={() => navigate('/invoices')} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              عرض الكل
            </button>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : recentSales && recentSales.length > 0 ? (
              <div className="space-y-2">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-surface-border/60 dark:hover:bg-surface-hover/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{sale.invoice_number}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(sale.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(sale.total)}</p>
                      <Badge variant={sale.payment_method === 'cash' ? 'success' : sale.payment_method === 'card' ? 'info' : 'warning'}>
                        {paymentLabel(sale.payment_method)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Receipt className="h-8 w-8" />} title="لا توجد مبيعات بعد" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>الأكثر مبيعاً</CardTitle></CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} />
                  <YAxis type="category" dataKey="product_name" tick={{ fontSize: 10, fill: axisColor }} width={100} orientation="right" />
                  <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: 'none', borderRadius: '12px' }} />
                  <Bar dataKey="quantity" name="الكمية" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<Package className="h-8 w-8" />} title="لا توجد بيانات" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function paymentLabel(method: string): string {
  return { cash: 'نقداً', card: 'فيزا', wallet: 'محفظة' }[method] ?? method;
}

type CardColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

const colorMap: Record<CardColor, string> = {
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
  secondary: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-500/10 dark:text-secondary-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400',
  info: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: CardColor;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon, color, trend, trendUp }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', colorMap[color])}>{icon}</div>
            {trend && (
              <span className={cn('flex items-center gap-1 text-xs font-medium', trendUp ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400')}>
                {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3 rotate-180" />}
                {trend}
              </span>
            )}
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{title}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MiniStatProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger';
  onClick?: () => void;
}

function MiniStat({ label, value, icon, variant = 'default', onClick }: MiniStatProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-white p-4 text-right transition-all hover:shadow-card dark:bg-surface-card',
        variant === 'warning' ? 'border-warning-200 dark:border-warning-500/30' : variant === 'danger' ? 'border-danger-200 dark:border-danger-500/30' : 'border-slate-200 dark:border-surface-border',
      )}
    >
      <div className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg',
        variant === 'warning' ? 'bg-warning-100 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400'
        : variant === 'danger' ? 'bg-danger-100 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      )}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </button>
  );
}
