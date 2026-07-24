import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Moon, Sun, Bell, Search, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications } from '@/services/api';
import { formatTime, cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'header'],
    queryFn: () => fetchNotifications(true),
    refetchInterval: 30000,
  });

  const unread = notifications?.length ?? 0;

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-surface-border dark:bg-surface-sidebar/80 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-surface-hover lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث سريع..."
            className="h-9 w-64 rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-border dark:bg-surface-card/60 dark:text-slate-100 dark:focus:bg-surface-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="relative rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-surface-hover"
          aria-label="تبديل الوضع"
        >
          <AnimatePresence mode="wait">
            {theme === 'light' ? (
              <motion.div key="moon" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                <Moon className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div key="sun" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                <Sun className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-surface-hover"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute left-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-float dark:border-surface-border dark:bg-surface-card"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-surface-border">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">الإشعارات</h3>
                    {unread > 0 && <span className="text-xs text-primary-600 dark:text-primary-400">{unread} غير مقروء</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 6).map((n) => (
                        <div key={n.id} className="border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 dark:border-surface-border/60 dark:hover:bg-surface-hover/50">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                          <p className="mt-1 text-[10px] text-slate-400">{formatTime(n.created_at)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm text-slate-400">
                        <Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        لا توجد إشعارات جديدة
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                    className="block w-full border-t border-slate-200 p-3 text-center text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:border-surface-border dark:text-primary-400 dark:hover:bg-primary-500/10"
                  >
                    عرض كل الإشعارات
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-surface-hover"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 text-sm font-bold text-white">
              {user?.name.charAt(0) ?? '؟'}
            </div>
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', userOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {userOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute left-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-float dark:border-surface-border dark:bg-surface-card"
                >
                  <div className="border-b border-slate-200 p-4 dark:border-surface-border">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 p-3.5 text-sm text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
