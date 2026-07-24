export type UserRole = 'manager' | 'pharmacist' | 'cashier';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  scientific_name: string | null;
  manufacturer: string | null;
  category_id: string | null;
  barcode: string | null;
  item_number: string | null;
  cost_price: number;
  sale_price: number;
  quantity: number;
  min_stock: number;
  production_date: string | null;
  expiry_date: string | null;
  batch_number: string | null;
  storage_location: string | null;
  image_url: string | null;
  description: string | null;
  requires_prescription: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  total_orders: number;
  total_purchases: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  cashier_name: string | null;
  cashier_id: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'wallet';
  status: 'completed' | 'refunded' | 'pending';
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer | null;
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total: number;
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expired' | 'near_expiry' | 'new_sale' | 'new_product';
  title: string;
  message: string;
  product_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  pharmacy_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  tax_rate: number;
  invoice_prefix: string;
  invoice_counter: number;
  created_at: string;
  updated_at: string;
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>;
export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_orders' | 'total_purchases'>;
export type SupplierInput = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type CategoryInput = Pick<Category, 'name' | 'description'>;

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardStats {
  todaySales: number;
  monthSales: number;
  totalProfit: number;
  totalProducts: number;
  totalCustomers: number;
  totalInvoices: number;
  lowStockCount: number;
  expiredCount: number;
}

export interface SalesChartPoint {
  date: string;
  label: string;
  sales: number;
  profit: number;
}

export interface TopProduct {
  product_name: string;
  quantity: number;
  revenue: number;
}
