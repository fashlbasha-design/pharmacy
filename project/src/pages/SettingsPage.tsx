import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Save, Upload, Building2, Phone, Mail, MapPin, DollarSign, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { fetchSettings, updateSettings, uploadLogo } from '@/services/api';
import type { Settings } from '@/types';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Settings>>({});

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  // Sync form when settings load
  const current: Partial<Settings> = {
    pharmacy_name: form.pharmacy_name ?? settings?.pharmacy_name ?? '',
    logo_url: form.logo_url ?? settings?.logo_url ?? null,
    address: form.address ?? settings?.address ?? '',
    phone: form.phone ?? settings?.phone ?? '',
    email: form.email ?? settings?.email ?? '',
    currency: form.currency ?? settings?.currency ?? 'ج.م',
    tax_rate: form.tax_rate ?? settings?.tax_rate ?? 14,
    invoice_prefix: form.invoice_prefix ?? settings?.invoice_prefix ?? 'INV',
  };

  const handleChange = (field: keyof Settings, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      let logoUrl = current.logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }
      await updateSettings(settings.id, {
        pharmacy_name: current.pharmacy_name,
        address: current.address,
        phone: current.phone,
        email: current.email,
        currency: current.currency,
        tax_rate: Number(current.tax_rate),
        invoice_prefix: current.invoice_prefix,
        logo_url: logoUrl,
      });
      toast.success('تم حفظ الإعدادات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setForm({});
      setLogoFile(null);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="الإعدادات"
        description="بيانات الصيدلية والإعدادات العامة"
        icon={<SettingsIcon className="h-5 w-5" />}
        actions={<Button onClick={handleSave} loading={loading}><Save className="h-4 w-4" />حفظ التغييرات</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pharmacy info */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات الصيدلية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {logoPreview || current.logo_url ? (
                  <img src={logoPreview || current.logo_url || ''} alt="شعار" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
                  <span className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Upload className="h-4 w-4" />
                    تغيير الشعار
                  </span>
                </label>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">PNG أو JPG، حتى 2MB</p>
              </div>
            </div>

            <Input
              label="اسم الصيدلية"
              value={current.pharmacy_name}
              onChange={(e) => handleChange('pharmacy_name', e.target.value)}
              icon={<Building2 className="h-4 w-4" />}
            />
            <Textarea
              label="العنوان"
              rows={2}
              value={current.address ?? ''}
              onChange={(e) => handleChange('address', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="رقم الهاتف"
                value={current.phone ?? ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                icon={<Phone className="h-4 w-4" />}
              />
              <Input
                label="البريد الإلكتروني"
                value={current.email ?? ''}
                onChange={(e) => handleChange('email', e.target.value)}
                icon={<Mail className="h-4 w-4" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial settings */}
        <Card>
          <CardHeader>
            <CardTitle>الإعدادات المالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="العملة"
              value={current.currency ?? ''}
              onChange={(e) => handleChange('currency', e.target.value)}
              icon={<DollarSign className="h-4 w-4" />}
              placeholder="ج.م"
            />
            <Input
              label="نسبة الضريبة (%)"
              type="number"
              step="0.01"
              value={String(current.tax_rate)}
              onChange={(e) => handleChange('tax_rate', e.target.value)}
            />
            <Input
              label="بادئة رقم الفاتورة"
              value={current.invoice_prefix}
              onChange={(e) => handleChange('invoice_prefix', e.target.value)}
              icon={<Receipt className="h-4 w-4" />}
              placeholder="INV"
            />
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                رقم الفاتورة التالي: <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                  {current.invoice_prefix}-{String((settings?.invoice_counter ?? 1)).padStart(6, '0')}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
