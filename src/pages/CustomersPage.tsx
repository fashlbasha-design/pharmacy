import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/services/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Customer } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => fetchCustomers(search || undefined),
  });

  const filtered = useMemo(() => customers ?? [], [customers]);
  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleAdd = () => {
    setEditing(null);
    reset({ name: '', phone: '', email: '', address: '', notes: '' });
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditing(customer);
    reset({
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
      notes: customer.notes ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        notes: values.notes || null,
      };
      if (editing) {
        await updateCustomer(editing.id, payload);
        toast.success('تم تحديث العميل');
      } else {
        await createCustomer(payload);
        toast.success('تم إضافة العميل');
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setModalOpen(false);
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      toast.success('تم حذف العميل');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteTarget(null);
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'الاسم',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            {c.name.charAt(0)}
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'الهاتف',
      render: (c) => c.phone ? <span className="ltr-nums text-sm text-slate-600 dark:text-slate-400">{c.phone}</span> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'email',
      header: 'البريد',
      render: (c) => c.email ? <span className="text-sm text-slate-600 dark:text-slate-400">{c.email}</span> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'total_orders',
      header: 'الطلبات',
      render: (c) => <Badge variant="info">{formatNumber(c.total_orders)}</Badge>,
    },
    {
      key: 'total_purchases',
      header: 'إجمالي المشتريات',
      render: (c) => <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(c.total_purchases)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="العملاء"
        description={`${total} عميل`}
        icon={<Users className="h-5 w-5" />}
        actions={<Button onClick={handleAdd}><Plus className="h-4 w-4" />إضافة عميل</Button>}
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالاسم أو الهاتف أو البريد..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pr-9 pl-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </motion.div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="لا يوجد عملاء"
        actions={(customer) => (
          <div className="flex items-center gap-1">
            <button onClick={() => handleEdit(customer)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20" title="تعديل">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteTarget(customer)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20" title="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'تعديل العميل' : 'إضافة عميل'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={loading}>{editing ? 'حفظ' : 'إضافة'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="الاسم *" error={errors.name?.message} {...register('name')} placeholder="اسم العميل" />
          <Input label="الهاتف" {...register('phone')} placeholder="01xxxxxxxxx" icon={<Phone className="h-4 w-4" />} />
          <Input label="البريد الإلكتروني" {...register('email')} placeholder="email@example.com" icon={<Mail className="h-4 w-4" />} />
          <Input label="العنوان" {...register('address')} placeholder="العنوان" icon={<MapPin className="h-4 w-4" />} />
          <Textarea label="ملاحظات" rows={2} {...register('notes')} placeholder="ملاحظات إضافية..." />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف العميل"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmText="نعم، حذف"
        loading={deleting}
      />
    </div>
  );
}
