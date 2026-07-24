import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Users, Truck,
  Warehouse, BarChart3, Bell, Settings as SettingsIcon, X, Pill,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/products', label: 'المنتجات', icon: Package },
  { to: '/pos', label: 'نقطة البيع', icon: ShoppingCart },
  { to: '/invoices', label: 'الفواتير', icon: FileText },
  { to: '/customers', label: 'العملاء', icon: Users },
  { to: '/suppliers', label: 'الموردون', icon: Truck },
  { to: '/inventory', label: 'المخزون', icon: Warehouse },
  { to: '/reports', label: 'التقارير', icon: BarChart3 },
  { to: '/notifications', label: 'الإشعارات', icon: Bell },
  { to: '/settings', label: 'الإعدادات', icon: SettingsIcon, roles: ['manager'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const filtered = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-slate-200 bg-white transition-transform duration-300 dark:border-surface-border dark:bg-surface-sidebar lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 px-5 dark:border-surface-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-glow-primary">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">صيدلية الشفاء</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">نظام الإدارة</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-hover lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filtered.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'premium-nav-item group',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-hover dark:hover:text-slate-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-5 w-5 transition-transform group-hover:scale-110', isActive && 'text-primary-600 dark:text-primary-400')} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        {user && (
          <div className="border-t border-slate-200 p-4 dark:border-surface-border">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-surface-hover/50">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 text-sm font-bold text-white">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel(user.role)}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function roleLabel(role: UserRole): string {
  return { manager: 'مدير', pharmacist: 'صيدلي', cashier: 'كاشير' }[role];
}
