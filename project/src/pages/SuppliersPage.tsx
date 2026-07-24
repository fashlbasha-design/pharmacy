import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Truck, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/services/api';
import type { Supplier } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  company_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => fetchSuppliers(search || undefined),
  });

  const filtered = useMemo(() => suppliers ?? [], [suppliers]);
  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleAdd = () => {
    setEditing(null);
    reset({ name: '', company_name: '', phone: '', email: '', address: '', notes: '' });
    setModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditing(supplier);
    reset({
      name: supplier.name,
      company_name: supplier.company_name ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        company_name: values.company_name || null,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        notes: values.notes || null,
      };
      if (editing) {
        await updateSupplier(editing.id, payload);
        toast.success('تم تحديث المورد');
      } else {
        await createSupplier(payload);
        toast.success('تم إضافة المورد');
      }
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
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
      await deleteSupplier(deleteTarget.id);
      toast.success('تم حذف المورد');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTarget(null);
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'الاسم',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400">
            <Truck className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{s.name}</span>
        </div>
      ),
    },
    {
      key: 'company_name',
      header: 'الشركة',
      render: (s) => s.company_name ? <span className="text-sm text-slate-600 dark:text-slate-400">{s.company_name}</span> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'phone',
      header: 'الهاتف',
      render: (s) => s.phone ? <span className="ltr-nums text-sm text-slate-600 dark:text-slate-400">{s.phone}</span> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'email',
      header: 'البريد',
      render: (s) => s.email ? <span className="text-sm text-slate-600 dark:text-slate-400">{s.email}</span> : <span className="text-slate-400">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="الموردون"
        description={`${total} مورد`}
        icon={<Truck className="h-5 w-5" />}
        actions={<Button onClick={handleAdd}><Plus className="h-4 w-4" />إضافة مورد</Button>}
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالاسم أو الشركة أو الهاتف..."
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
        emptyMessage="لا يوجد موردون"
        actions={(supplier) => (
          <div className="flex items-center gap-1">
            <button onClick={() => handleEdit(supplier)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20" title="تعديل">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteTarget(supplier)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20" title="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'تعديل المورد' : 'إضافة مورد'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={loading}>{editing ? 'حفظ' : 'إضافة'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="الاسم *" error={errors.name?.message} {...register('name')} placeholder="اسم المورد" />
          <Input label="اسم الشركة" {...register('company_name')} placeholder="اسم الشركة" icon={<Building2 className="h-4 w-4" />} />
          <Input label="الهاتف" {...register('phone')} placeholder="02xxxxxxxx" icon={<Phone className="h-4 w-4" />} />
          <Input label="البريد الإلكتروني" {...register('email')} placeholder="email@example.com" icon={<Mail className="h-4 w-4" />} />
          <Input label="العنوان" {...register('address')} placeholder="العنوان" icon={<MapPin className="h-4 w-4" />} />
          <Textarea label="ملاحظات" rows={2} {...register('notes')} placeholder="ملاحظات..." />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المورد"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmText="نعم، حذف"
        loading={deleting}
      />
    </div>
  );
}
