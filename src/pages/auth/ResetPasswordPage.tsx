import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const { error } = await updatePassword(values.password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('تم تغيير كلمة المرور بنجاح');
      navigate('/dashboard');
    }
  };

  return (
    <AuthLayout title="تغيير كلمة المرور" description="أدخل كلمة المرور الجديدة">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="relative">
          <Input
            label="كلمة المرور الجديدة"
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

        <Input
          label="تأكيد كلمة المرور"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <Check className="h-4 w-4" />
          حفظ كلمة المرور
        </Button>

        <Link to="/login" className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          العودة لتسجيل الدخول
        </Link>
      </form>
    </AuthLayout>
  );
}
