import { supabase } from '@/lib/supabase';
import type {
  Product,
  ProductInput,
  Customer,
  CustomerInput,
  Supplier,
  SupplierInput,
  Category,
  CategoryInput,
  Sale,
  Notification,
  Settings,
  DashboardStats,
  SalesChartPoint,
  TopProduct,
} from '@/types';

// ============================================================
// PRODUCTS
// ============================================================
export async function fetchProducts(search?: string, categoryId?: string): Promise<Product[]> {
  let query = supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,scientific_name.ilike.%${search}%,barcode.ilike.%${search}%`);
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(input).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const { data, error } = await supabase.from('products').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadProductImage(file: File, productId: string): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${productId}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteProductImage(imagePath: string): Promise<void> {
  if (!imagePath) return;
  const fileName = imagePath.split('/').pop();
  if (!fileName) return;
  const { error } = await supabase.storage.from('product-images').remove([fileName]);
  if (error) throw error;
}

// ============================================================
// CATEGORIES
// ============================================================
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(input).select().single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
  const { data, error } = await supabase.from('categories').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// CUSTOMERS
// ============================================================
export async function fetchCustomers(search?: string): Promise<Customer[]> {
  let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data as Customer[];
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data, error } = await supabase.from('customers').insert(input).select().single();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>): Promise<Customer> {
  const { data, error } = await supabase.from('customers').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// SUPPLIERS
// ============================================================
export async function fetchSuppliers(search?: string): Promise<Supplier[]> {
  let query = supabase.from('suppliers').select('*').order('created_at', { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,phone.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data as Supplier[];
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const { data, error } = await supabase.from('suppliers').insert(input).select().single();
  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplier(id: string, input: Partial<SupplierInput>): Promise<Supplier> {
  const { data, error } = await supabase.from('suppliers').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// SALES
// ============================================================
export async function fetchSales(limit?: number, search?: string): Promise<Sale[]> {
  let query = supabase
    .from('sales')
    .select('*, customer:customers(*), sale_items(*)')
    .order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  if (search) query = query.or(`invoice_number.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data as Sale[];
}

export async function fetchSaleById(id: string): Promise<Sale | null> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, customer:customers(*), sale_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Sale | null;
}

export interface CreateSaleInput {
  customer_id: string | null;
  cashier_name: string;
  cashier_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'wallet';
  notes?: string;
  items: { product_id: string; product_name: string; quantity: number; unit_price: number; cost_price: number; total: number }[];
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const { data: settings } = await supabase.from('settings').select('invoice_prefix').maybeSingle();
  const prefix = settings?.invoice_prefix ?? 'INV';

  const { data: invoiceData, error: rpcError } = await supabase.rpc('generate_invoice_number', {
    prefix,
  });
  if (rpcError) throw rpcError;
  const invoiceNumber = invoiceData as string;

  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert({
      invoice_number: invoiceNumber,
      customer_id: input.customer_id,
      cashier_name: input.cashier_name,
      cashier_id: input.cashier_id,
      subtotal: input.subtotal,
      discount: input.discount,
      tax: input.tax,
      total: input.total,
      payment_method: input.payment_method,
      status: 'completed',
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (saleError) throw saleError;

  const sale = saleData as Sale;

  const itemsPayload = input.items.map((item) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    cost_price: item.cost_price,
    total: item.total,
  }));

  const { error: itemsError } = await supabase.from('sale_items').insert(itemsPayload);
  if (itemsError) throw itemsError;

  // Create a notification for the new sale
  await supabase.from('notifications').insert({
    type: 'new_sale',
    title: 'فاتورة جديدة',
    message: `تم إنشاء الفاتورة ${invoiceNumber} بقيمة ${input.total.toFixed(2)} ج.م`,
    is_read: false,
  });

  return sale;
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function fetchNotifications(unreadOnly?: boolean): Promise<Notification[]> {
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
  if (unreadOnly) query = query.eq('is_read', false);
  const { data, error } = await query;
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// SETTINGS
// ============================================================
export async function fetchSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data as Settings | null;
}

export async function updateSettings(id: string, input: Partial<Settings>): Promise<Settings> {
  const { data, error } = await supabase.from('settings').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Settings;
}

export async function uploadLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const path = `logo.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [todaySalesRes, monthSalesRes, productsRes, customersRes, salesRes, lowStockRes, expiredRes] =
    await Promise.all([
      supabase.from('sales').select('total').gte('created_at', startOfToday),
      supabase.from('sales').select('total, sale_items(cost_price, quantity, unit_price)').gte('created_at', startOfMonth),
      supabase.from('products').select('id, cost_price, sale_price, quantity'),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('sales').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id, quantity, min_stock'),
      supabase.from('products').select('id').lt('expiry_date', now.toISOString()),
    ]);

  const todaySales = (todaySalesRes.data ?? []).reduce((sum, s) => sum + Number(s.total), 0);
  const monthSales = (monthSalesRes.data ?? []).reduce((sum, s) => sum + Number(s.total), 0);

  // Profit: sale revenue - cost for each sale item
  let monthProfit = 0;
  for (const sale of monthSalesRes.data ?? []) {
    const items = sale.sale_items as { cost_price: number; quantity: number; unit_price: number }[] | null;
    if (items) {
      for (const item of items) {
        monthProfit += (Number(item.unit_price) - Number(item.cost_price)) * item.quantity;
      }
    }
  }

  return {
    todaySales,
    monthSales,
    totalProfit: monthProfit,
    totalProducts: productsRes.data?.length ?? 0,
    totalCustomers: customersRes.count ?? 0,
    totalInvoices: salesRes.count ?? 0,
    lowStockCount: (lowStockRes.data ?? []).filter((p) => p.quantity <= p.min_stock).length,
    expiredCount: expiredRes.data?.length ?? 0,
  };
}

export async function fetchSalesChartData(days = 30): Promise<SalesChartPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data, error } = await supabase
    .from('sales')
    .select('created_at, total, sale_items(cost_price, quantity, unit_price)')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;

  const dayMap = new Map<string, { sales: number; profit: number }>();
  for (const sale of data ?? []) {
    const d = new Date(sale.created_at);
    const key = d.toISOString().split('T')[0];
    const existing = dayMap.get(key) ?? { sales: 0, profit: 0 };
    existing.sales += Number(sale.total);
    const items = sale.sale_items as { cost_price: number; quantity: number; unit_price: number }[] | null;
    if (items) {
      for (const item of items) {
        existing.profit += (Number(item.unit_price) - Number(item.cost_price)) * item.quantity;
      }
    }
    dayMap.set(key, existing);
  }

  const points: SalesChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const val = dayMap.get(key);
    points.push({
      date: key,
      label: new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(d),
      sales: val?.sales ?? 0,
      profit: val?.profit ?? 0,
    });
  }
  return points;
}

export async function fetchTopProducts(limit = 5): Promise<TopProduct[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const { data, error } = await supabase
    .from('sale_items')
    .select('product_name, quantity, unit_price, cost_price')
    .gte('created_at', startDate.toISOString());
  if (error) throw error;

  const map = new Map<string, { quantity: number; revenue: number }>();
  for (const item of data ?? []) {
    const existing = map.get(item.product_name) ?? { quantity: 0, revenue: 0 };
    existing.quantity += item.quantity;
    existing.revenue += Number(item.unit_price) * item.quantity;
    map.set(item.product_name, existing);
  }

  return Array.from(map.entries())
    .map(([product_name, v]) => ({ product_name, quantity: v.quantity, revenue: v.revenue }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export async function fetchRecentSales(limit = 5): Promise<Sale[]> {
  return fetchSales(limit);
}
