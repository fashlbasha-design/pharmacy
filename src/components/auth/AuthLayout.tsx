import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Pill, HeartPulse, ShieldCheck, Activity } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-secondary-700 to-surface p-12 lg:flex">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary-400 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-secondary-400 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">صيدلية الشفاء</h1>
            <p className="text-sm text-primary-200">نظام الإدارة الاحترافي</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold leading-tight text-white">
              إدارة صيدليتك باحترافية وسهولة
            </h2>
            <p className="mt-3 max-w-md text-primary-100/90">
              نظام متكامل لإدارة المبيعات والمخزون والفواتير والتقارير — كل ما تحتاجه في مكان واحد
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { icon: Activity, title: 'متابعة المبيعات لحظياً', desc: 'إحصائيات وتقارير مفصلة' },
              { icon: ShieldCheck, title: 'إدارة المخزون بذكاء', desc: 'تنبيهات النفاد والانتهاء' },
              { icon: HeartPulse, title: 'نقطة بيع سريعة', desc: 'بيع بالباركود وطباعة فواتير' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xl ring-1 ring-white/10">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">{feature.title}</p>
                  <p className="text-sm text-primary-200">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-primary-200">© 2026 صيدلية الشفاء. جميع الحقوق محفوظة</p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 p-6 dark:bg-surface lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-glow-primary">
              <Pill className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">صيدلية الشفاء</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>

          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
