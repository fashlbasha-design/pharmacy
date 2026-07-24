import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const { error } = await signIn(values.email, values.password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/dashboard');
    }
  };

  return (
    <AuthLayout title="تسجيل الدخول" description="أدخل بياناتك للوصول إلى لوحة التحكم">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800" />
            تذكرني
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <LogIn className="h-4 w-4" />
          تسجيل الدخول
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          ليس لديك حساب؟{' '}
          <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            إنشاء حساب جديد
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
