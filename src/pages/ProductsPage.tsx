import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, Plus, Search, Edit2, Trash2, Copy, Filter, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import {
  fetchProducts, fetchCategories, deleteProduct, createProduct,
} from '@/services/api';
import {
  formatCurrency, getStockStatus, getExpiryStatus, getDaysUntilExpiry, cn,
} from '@/lib/utils';
import type { Product, Category } from '@/types';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search, categoryFilter],
    queryFn: () => fetchProducts(search || undefined, categoryFilter || undefined),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const filtered = useMemo(() => products ?? [], [products]);
  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleCopy = async (product: Product) => {
    try {
      await createProduct({
        name: `${product.name} (نسخة)`,
        scientific_name: product.scientific_name,
        manufacturer: product.manufacturer,
        category_id: product.category_id,
        barcode: null,
        item_number: product.item_number,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        quantity: 0,
        min_stock: product.min_stock,
        production_date: product.production_date,
        expiry_date: product.expiry_date,
        batch_number: product.batch_number,
        storage_location: product.storage_location,
        image_url: product.image_url,
        description: product.description,
        requires_prescription: product.requires_prescription,
      });
      toast.success('تم نسخ المنتج بنجاح');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch {
      toast.error('حدث خطأ أثناء النسخ');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success('تم حذف المنتج');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteTarget(null);
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'المنتج',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.scientific_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'التصنيف',
      render: (p) => p.category?.name ? <Badge variant="info">{p.category.name}</Badge> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'barcode',
      header: 'الباركود',
      render: (p) => <span className="ltr-nums font-mono text-xs text-slate-600 dark:text-slate-400">{p.barcode ?? '—'}</span>,
    },
    {
      key: 'sale_price',
      header: 'السعر',
      render: (p) => <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(p.sale_price)}</span>,
    },
    {
      key: 'quantity',
      header: 'المخزون',
      render: (p) => {
        const status = getStockStatus(p.quantity, p.min_stock);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{p.quantity}</span>
            <Badge variant={status === 'out' ? 'danger' : status === 'low' ? 'warning' : 'success'} dot>
              {status === 'out' ? 'نفد' : status === 'low' ? 'منخفض' : 'متوفر'}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'expiry_date',
      header: 'الصلاحية',
      render: (p) => {
        if (!p.expiry_date) return <span className="text-slate-400">—</span>;
        const status = getExpiryStatus(p.expiry_date);
        const days = getDaysUntilExpiry(p.expiry_date);
        return (
          <div className="flex flex-col">
            <Badge variant={status === 'expired' ? 'danger' : status === 'critical' ? 'warning' : status === 'warning' ? 'info' : 'success'}>
              {status === 'expired' ? 'منتهي' : days <= 30 ? `${days} يوم` : 'سليم'}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'requires_prescription',
      header: 'روشتة',
      render: (p) => p.requires_prescription ? <Badge variant="danger">نعم</Badge> : <Badge>لا</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="إدارة المنتجات"
        description={`${total} منتج في المخزون`}
        icon={<Package className="h-5 w-5" />}
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Button>
        }
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالاسم أو الاسم العلمي أو الباركود..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pr-9 pl-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">كل التصنيفات</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
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
        emptyMessage="لا توجد منتجات مطابقة"
        actions={(product) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(product)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
              title="تعديل"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleCopy(product)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/20"
              title="نسخ"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(product)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
              title="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        categories={categories ?? []}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المنتج"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="نعم، حذف"
        loading={deleting}
      />
    </div>
  );
}
