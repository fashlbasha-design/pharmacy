import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Trash2, RefreshCw, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useQueryClient } from '@tanstack/react-query';
import {
  createProduct, updateProduct, uploadProductImage, deleteProductImage,
  fetchCategories,
} from '@/services/api';
import { generateBarcode, cn } from '@/lib/utils';
import type { Product, Category } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'اسم الدواء مطلوب'),
  scientific_name: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  item_number: z.string().optional().nullable(),
  cost_price: z.coerce.number().min(0, 'سعر الشراء مطلوب'),
  sale_price: z.coerce.number().min(0, 'سعر البيع مطلوب'),
  quantity: z.coerce.number().int().min(0, 'الكمية مطلوبة'),
  min_stock: z.coerce.number().int().min(0, 'الحد الأدنى مطلوب'),
  production_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  batch_number: z.string().optional().nullable(),
  storage_location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  requires_prescription: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  categories: Category[];
}

export function ProductFormModal({ open, onClose, product, categories }: ProductFormModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);

  useEffect(() => {
    setCategoriesList(categories);
  }, [categories]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as never,
    defaultValues: {
      requires_prescription: false,
      cost_price: 0,
      sale_price: 0,
      quantity: 0,
      min_stock: 10,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        scientific_name: product.scientific_name ?? '',
        manufacturer: product.manufacturer ?? '',
        category_id: product.category_id ?? '',
        barcode: product.barcode ?? '',
        item_number: product.item_number ?? '',
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        quantity: product.quantity,
        min_stock: product.min_stock,
        production_date: product.production_date ?? '',
        expiry_date: product.expiry_date ?? '',
        batch_number: product.batch_number ?? '',
        storage_location: product.storage_location ?? '',
        description: product.description ?? '',
        requires_prescription: product.requires_prescription,
      });
      setImagePreview(product.image_url ?? null);
    } else {
      reset({
        name: '', scientific_name: '', manufacturer: '', category_id: '',
        barcode: generateBarcode(), item_number: '',
        cost_price: 0, sale_price: 0, quantity: 0, min_stock: 10,
        production_date: '', expiry_date: '', batch_number: '',
        storage_location: '', description: '', requires_prescription: false,
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, open, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleGenerateBarcode = () => {
    setValue('barcode', generateBarcode());
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        category_id: values.category_id || null,
        production_date: values.production_date || null,
        expiry_date: values.expiry_date || null,
        scientific_name: values.scientific_name || null,
        manufacturer: values.manufacturer || null,
        barcode: values.barcode || null,
        item_number: values.item_number || null,
        batch_number: values.batch_number || null,
        storage_location: values.storage_location || null,
        description: values.description || null,
      };

      if (product) {
        let imageUrl = product.image_url;
        if (imageFile) {
          const uploaded = await uploadProductImage(imageFile, product.id);
          if (product.image_url) {
            await deleteProductImage(product.image_url).catch(() => {});
          }
          imageUrl = uploaded.url;
        } else if (!imagePreview && product.image_url) {
          await deleteProductImage(product.image_url).catch(() => {});
          imageUrl = null;
        }
        await updateProduct(product.id, { ...payload, image_url: imageUrl });
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const created = await createProduct({ ...payload, image_url: null });
        if (imageFile) {
          const uploaded = await uploadProductImage(imageFile, created.id);
          await updateProduct(created.id, { image_url: uploaded.url });
        }
        // Create notification for new product
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'new_product',
            title: 'منتج جديد',
            message: `تمت إضافة المنتج: ${created.name}`,
            is_read: false,
          }),
        }).catch(() => {});
        toast.success('تم إضافة المنتج بنجاح');
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onClose();
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const costPrice = watch('cost_price') ?? 0;
  const salePrice = watch('sale_price') ?? 0;
  const profit = salePrice - costPrice;
  const margin = costPrice > 0 ? (profit / costPrice) * 100 : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
      description={product ? `تعديل بيانات ${product.name}` : 'أدخل بيانات الدواء الجديد'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            {product ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Image upload */}
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {imagePreview ? (
              <img src={imagePreview} alt="معاينة" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <Pill className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                <Upload className="h-4 w-4" />
                رفع صورة
              </span>
            </label>
            {imagePreview && (
              <button type="button" onClick={handleRemoveImage} className="inline-flex items-center gap-1.5 text-xs text-danger-600 hover:text-danger-700">
                <Trash2 className="h-3.5 w-3.5" />
                حذف الصورة
              </button>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="اسم الدواء *" error={errors.name?.message} {...register('name')} placeholder="باراسيتامول 500مجم" />
          <Input label="الاسم العلمي" {...register('scientific_name')} placeholder="Paracetamol" />
          <Input label="الشركة المصنعة" {...register('manufacturer')} placeholder="فايزر" />
          <Select label="التصنيف" {...register('category_id')}>
            <option value="">اختر التصنيف</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
        </div>

        {/* Barcode + item number */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <Input label="الباركود" {...register('barcode')} placeholder="6001234567890" />
            <button
              type="button"
              onClick={handleGenerateBarcode}
              className="absolute left-2 top-[34px] rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <Input label="رقم الصنف" {...register('item_number')} placeholder="MED-001" />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="سعر الشراء" type="number" step="0.01" error={errors.cost_price?.message} {...register('cost_price')} />
          <Input label="سعر البيع" type="number" step="0.01" error={errors.sale_price?.message} {...register('sale_price')} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">نسبة الربح</label>
            <div className="flex h-10 items-center justify-between rounded-xl bg-slate-50 px-3 dark:bg-slate-800">
              <span className={cn('text-sm font-semibold', profit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400')}>
                {profit.toFixed(2)} ج.م
              </span>
              <Badge variant={margin >= 20 ? 'success' : margin >= 0 ? 'warning' : 'danger'}>
                {margin.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="الكمية" type="number" error={errors.quantity?.message} {...register('quantity')} />
          <Input label="الحد الأدنى للمخزون" type="number" error={errors.min_stock?.message} {...register('min_stock')} />
        </div>

        {/* Dates + batch */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="تاريخ الإنتاج" type="date" {...register('production_date')} />
          <Input label="تاريخ الانتهاء" type="date" {...register('expiry_date')} />
          <Input label="رقم التشغيلة" {...register('batch_number')} placeholder="BT-2025-001" />
        </div>

        {/* Location + prescription */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="مكان التخزين" {...register('storage_location')} placeholder="رف A1" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">يتطلب روشتة</label>
            <label className="flex h-10 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 px-3 dark:border-slate-700">
              <input type="checkbox" {...register('requires_prescription')} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">نعم، يتطلب روشتة طبية</span>
            </label>
          </div>
        </div>

        <Textarea label="الوصف" rows={3} {...register('description')} placeholder="وصف تفصيلي للدواء..." />
      </form>
    </Modal>
  );
}
