import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: z.enum(['manager', 'pharmacist', 'cashier']),
});

type FormValues = z.infer<typeof schema>;

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'manager' },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const { error } = await signUp(values.email, values.password, values.name, values.role as UserRole);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول');
      navigate('/login');
    }
  };

  const roles: { value: UserRole; label: string }[] = [
    { value: 'manager', label: 'مدير' },
    { value: 'pharmacist', label: 'صيدلي' },
    { value: 'cashier', label: 'كاشير' },
  ];

  return (
    <AuthLayout title="إنشاء حساب جديد" description="أنشئ حسابك للبدء في إدارة الصيدلية">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="الاسم الكامل"
          placeholder="أحمد محمد"
          icon={<User className="h-4 w-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="name@pharmacy.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="كلمة المرور"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute left-3 top-[38px] text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">الصلاحية</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((role) => (
              <label key={role.value} className="cursor-pointer">
                <input type="radio" value={role.value} {...register('role')} className="peer sr-only" />
                <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-300 p-3 text-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 dark:border-slate-700 dark:peer-checked:bg-primary-900/30 dark:peer-checked:text-primary-400">
                  <Shield className="h-5 w-5" />
                  <span className="text-xs font-medium">{role.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <UserPlus className="h-4 w-4" />
          إنشاء الحساب
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
