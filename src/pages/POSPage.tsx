import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X, Barcode,
  CreditCard, Wallet, Banknote, UserPlus, Check, Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  fetchProducts, fetchCustomers, createSale, fetchSettings, createCustomer,
} from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { Product, Customer, CartItem, Settings } from '@/types';

type PaymentMethod = 'cash' | 'card' | 'wallet';

export function POSPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'pos', search],
    queryFn: () => fetchProducts(search || undefined),
  });
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetchCustomers(),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  // Barcode scanning: listen for rapid input
  useEffect(() => {
    let buffer = '';
    let timeout: ReturnType<typeof setTimeout>;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      buffer += e.key;
      clearTimeout(timeout);
      timeout = setTimeout(() => { buffer = ''; }, 200);
      if (buffer.length >= 8 && e.key === 'Enter') {
        const found = products?.find((p) => p.barcode === buffer.trim());
        if (found) addToCart(found);
        buffer = '';
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [products]);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error('هذا المنتج غير متوفر في المخزون');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error('الكمية المطلوبة تتجاوز المخزون');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty > item.product.quantity) {
            toast.error('الكمية تتجاوز المخزون');
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0), [cart]);
  const taxRate = settings?.tax_rate ?? 14;
  const taxAmount = useMemo(() => ((subtotal - discount) * taxRate) / 100, [subtotal, discount, taxRate]);
  const total = subtotal - discount + taxAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    setProcessing(true);
    try {
      const sale = await createSale({
        customer_id: selectedCustomerId || null,
        cashier_name: user?.name ?? 'كاشير',
        cashier_id: user?.id ?? '',
        subtotal,
        discount,
        tax: taxAmount,
        total,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.sale_price,
          cost_price: item.product.cost_price,
          total: item.product.sale_price * item.quantity,
        })),
      });
      setLastInvoice(sale.invoice_number);
      setSuccessOpen(true);
      setCheckoutOpen(false);
      clearCart();
      setSelectedCustomerId('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error('حدث خطأ أثناء إتمام البيع');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="نقطة البيع"
        description="ابحث بالاسم أو امسح الباركود لإضافة المنتجات"
        icon={<ShoppingCart className="h-5 w-5" />}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Products section */}
        <div className="flex flex-col lg:col-span-3">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو امسح الباركود..."
              autoFocus
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-4 text-sm text-slate-900 shadow-soft transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-32 rounded-xl" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {products.map((product) => (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                    className={cn(
                      'group flex flex-col items-start rounded-xl border p-3 text-right transition-all',
                      product.quantity <= 0
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-800/50'
                        : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-card dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700',
                    )}
                  >
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        <Barcode className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs font-medium text-slate-900 dark:text-slate-100">{product.name}</p>
                    <div className="mt-1.5 flex w-full items-center justify-between">
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.sale_price)}</span>
                      <Badge variant={product.quantity <= 0 ? 'danger' : product.quantity <= product.min_stock ? 'warning' : 'success'}>
                        {product.quantity}
                      </Badge>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                لا توجد منتجات مطابقة
              </div>
            )}
          </div>
        </div>

        {/* Cart section */}
        <div className="flex flex-col lg:col-span-2">
          <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Cart header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">السلة</h3>
                {cart.length > 0 && <Badge variant="primary">{cart.length}</Badge>}
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs text-danger-600 hover:text-danger-700">
                  مسح الكل
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <ShoppingCart className="mb-2 h-12 w-12 opacity-30" />
                  <p className="text-sm">السلة فارغة</p>
                  <p className="mt-1 text-xs">اضغط على منتج لإضافته</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map((item) => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="mb-2 flex items-center gap-2 rounded-xl border border-slate-100 p-2.5 dark:border-slate-800"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(item.product.sale_price)} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeFromCart(item.product.id)} className="mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-danger-500 transition-colors hover:bg-danger-50 dark:hover:bg-danger-900/20">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Cart summary */}
            {cart.length > 0 && (
              <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                {/* Customer selector */}
                <div className="mb-3 flex items-center gap-2">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="h-9 flex-1 rounded-xl border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">عميل نقدي (بدون حساب)</option>
                    {customers?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setCustomerModalOpen(true)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>

                {/* Discount */}
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs text-slate-600 dark:text-slate-400">الخصم</label>
                  <input
                    type="number"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-sm focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                {/* Totals */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>المجموع الفرعي</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>الخصم</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>الضريبة ({taxRate}%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100">
                    <span>الإجمالي</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash' as const, label: 'نقداً', icon: Banknote },
                    { value: 'card' as const, label: 'فيزا', icon: CreditCard },
                    { value: 'wallet' as const, label: 'محفظة', icon: Wallet },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-all',
                        paymentMethod === m.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400',
                      )}
                    >
                      <m.icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  ))}
                </div>

                <Button className="mt-3 w-full" size="lg" onClick={() => setCheckoutOpen(true)}>
                  <Receipt className="h-4 w-4" />
                  إتمام البيع
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add customer modal */}
      <AddCustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onCreated={(id) => {
          setSelectedCustomerId(id);
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        }}
      />

      {/* Checkout confirmation */}
      <Modal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="تأكيد البيع"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>إلغاء</Button>
            <Button onClick={handleCheckout} loading={processing}>
              <Check className="h-4 w-4" />
              تأكيد البيع
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">عدد المنتجات</span>
            <span className="font-medium">{cart.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">طريقة الدفع</span>
            <span className="font-medium">{paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'card' ? 'فيزا' : 'محفظة'}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold dark:border-slate-800">
            <span>الإجمالي</span>
            <span className="text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
          </div>
        </div>
      </Modal>

      {/* Success modal */}
      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} size="sm">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
          >
            <Check className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </motion.div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">تم البيع بنجاح</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">رقم الفاتورة: <span className="font-mono font-medium">{lastInvoice}</span></p>
          <div className="mt-6 flex w-full gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setSuccessOpen(false)}>
              بيع جديد
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setSuccessOpen(false);
                window.open(`/invoices?print=${lastInvoice}`, '_blank');
              }}
            >
              <Receipt className="h-4 w-4" />
              طباعة الفاتورة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AddCustomerModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    setLoading(true);
    try {
      const customer = await createCustomer({ name, phone: phone || null, email: email || null, address: address || null, notes: null });
      toast.success('تم إضافة العميل');
      onCreated(customer.id);
      setName(''); setPhone(''); setEmail(''); setAddress('');
      onClose();
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إضافة عميل سريع"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit} loading={loading}>إضافة</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="الاسم *" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم العميل" />
        <Input label="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
        <Input label="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        <Input label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان" />
      </div>
    </Modal>
  );
}
