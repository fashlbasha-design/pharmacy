import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const { error } = await resetPassword(values.email);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      setSent(true);
      toast.success('تم إرسال رابط إعادة التعيين إلى بريدك');
    }
  };

  if (sent) {
    return (
      <AuthLayout title="تحقق من بريدك" description="تم إرسال رابط إعادة تعيين كلمة المرور">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
            <MailCheck className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. تحقق من صندوق الوارد واتبع التعليمات.
          </p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            <ArrowRight className="h-4 w-4" />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="نسيت كلمة المرور" description="أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="name@pharmacy.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          إرسال رابط إعادة التعيين
        </Button>

        <Link to="/login" className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          العودة لتسجيل الدخول
        </Link>
      </form>
    </AuthLayout>
  );
}
