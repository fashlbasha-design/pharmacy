/*
# Create Pharmacy Management System Schema

## Summary
Complete database schema for a professional pharmacy management system with role-based
access control (manager, pharmacist, cashier). All authenticated staff share the same
pharmacy data.

## New Tables
- `categories` — product categories (antibiotics, painkillers, etc.)
- `products` — medicines with full inventory + pricing metadata
- `customers` — pharmacy customers with running totals
- `suppliers` — medicine suppliers
- `sales` — sale invoice headers
- `sale_items` — individual line items within a sale
- `notifications` — system alerts (low stock, expiry, new sale)
- `settings` — single-row pharmacy-wide configuration

## Relationships
- products.category_id -> categories(id) ON DELETE SET NULL
- sale_items.sale_id -> sales(id) ON DELETE CASCADE
- sale_items.product_id -> products(id) ON DELETE SET NULL
- sales.customer_id -> customers(id) ON DELETE SET NULL
- notifications.product_id -> products(id) ON DELETE CASCADE

## Triggers
- updated_at auto-timestamp on all tables
- auto-decrement product stock when sale_items inserted
- auto-update customer totals when sale inserted

## Functions
- generate_invoice_number(prefix) — atomic counter-based invoice numbering
- decrement_stock_on_sale() — reduces product quantity on sale
- update_customer_totals_on_sale() — updates customer order/purchase totals

## Security (RLS)
- All tables enable RLS.
- All policies scoped TO authenticated (this is a signed-in app with login/signup).
- 4 separate CRUD policies per table (no FOR ALL).
- Storage bucket `product-images` created with authenticated CRUD policies.

## Important Notes
1. Auth users managed via Supabase Auth (auth.users). Roles stored in user_metadata.
2. Stock auto-adjusts when sales are created.
3. Settings table seeded with a default row so invoice generation works immediately.
*/

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UPDATED_AT HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_categories" ON public.categories;
CREATE POLICY "auth_select_categories" ON public.categories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_categories" ON public.categories;
CREATE POLICY "auth_insert_categories" ON public.categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_categories" ON public.categories;
CREATE POLICY "auth_update_categories" ON public.categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_categories" ON public.categories;
CREATE POLICY "auth_delete_categories" ON public.categories FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON public.suppliers(phone);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_suppliers" ON public.suppliers;
CREATE POLICY "auth_select_suppliers" ON public.suppliers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_suppliers" ON public.suppliers;
CREATE POLICY "auth_insert_suppliers" ON public.suppliers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_suppliers" ON public.suppliers;
CREATE POLICY "auth_update_suppliers" ON public.suppliers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_suppliers" ON public.suppliers;
CREATE POLICY "auth_delete_suppliers" ON public.suppliers FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  total_orders int NOT NULL DEFAULT 0,
  total_purchases numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_customers" ON public.customers;
CREATE POLICY "auth_select_customers" ON public.customers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_customers" ON public.customers;
CREATE POLICY "auth_insert_customers" ON public.customers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_customers" ON public.customers;
CREATE POLICY "auth_update_customers" ON public.customers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_customers" ON public.customers;
CREATE POLICY "auth_delete_customers" ON public.customers FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  scientific_name text,
  manufacturer text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  barcode text UNIQUE,
  item_number text,
  cost_price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 0,
  min_stock int NOT NULL DEFAULT 10,
  production_date date,
  expiry_date date,
  batch_number text,
  storage_location text,
  image_url text,
  description text,
  requires_prescription boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON public.products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_scientific_name ON public.products(scientific_name);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_products" ON public.products;
CREATE POLICY "auth_select_products" ON public.products FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_products" ON public.products;
CREATE POLICY "auth_insert_products" ON public.products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_products" ON public.products;
CREATE POLICY "auth_update_products" ON public.products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_products" ON public.products;
CREATE POLICY "auth_delete_products" ON public.products FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- SALES (invoice header)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  cashier_name text,
  cashier_id uuid,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON public.sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON public.sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_sales" ON public.sales;
CREATE POLICY "auth_select_sales" ON public.sales FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_sales" ON public.sales;
CREATE POLICY "auth_insert_sales" ON public.sales FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_sales" ON public.sales;
CREATE POLICY "auth_update_sales" ON public.sales FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_sales" ON public.sales;
CREATE POLICY "auth_delete_sales" ON public.sales FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- SALE_ITEMS (invoice line items)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  cost_price numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_sale_items" ON public.sale_items;
CREATE POLICY "auth_select_sale_items" ON public.sale_items FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_sale_items" ON public.sale_items;
CREATE POLICY "auth_insert_sale_items" ON public.sale_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_sale_items" ON public.sale_items;
CREATE POLICY "auth_update_sale_items" ON public.sale_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_sale_items" ON public.sale_items;
CREATE POLICY "auth_delete_sale_items" ON public.sale_items FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_notifications" ON public.notifications;
CREATE POLICY "auth_select_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_notifications" ON public.notifications;
CREATE POLICY "auth_insert_notifications" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_notifications" ON public.notifications;
CREATE POLICY "auth_update_notifications" ON public.notifications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_notifications" ON public.notifications;
CREATE POLICY "auth_delete_notifications" ON public.notifications FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- SETTINGS (single-row pharmacy config)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_name text NOT NULL DEFAULT 'صيدلية الشفاء',
  logo_url text,
  address text,
  phone text,
  email text,
  currency text NOT NULL DEFAULT 'ج.م',
  tax_rate numeric(5,2) NOT NULL DEFAULT 14.00,
  invoice_prefix text NOT NULL DEFAULT 'INV',
  invoice_counter int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_settings" ON public.settings;
CREATE POLICY "auth_select_settings" ON public.settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_settings" ON public.settings;
CREATE POLICY "auth_insert_settings" ON public.settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_settings" ON public.settings;
CREATE POLICY "auth_update_settings" ON public.settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_settings" ON public.settings;
CREATE POLICY "auth_delete_settings" ON public.settings FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sales_updated_at ON public.sales;
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- FUNCTION: generate_invoice_number
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number(prefix text DEFAULT 'INV')
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_counter int;
  new_number text;
BEGIN
  SELECT invoice_counter INTO current_counter FROM public.settings LIMIT 1 FOR UPDATE;
  IF current_counter IS NULL THEN
    current_counter := 1;
  END IF;
  new_number := prefix || '-' || LPAD(current_counter::text, 6, '0');
  UPDATE public.settings SET invoice_counter = current_counter + 1 WHERE id = (SELECT id FROM public.settings LIMIT 1);
  RETURN new_number;
END;
$$;

-- ============================================================
-- FUNCTION: decrement stock on sale_items insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'المنتج غير موجود';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.sale_items;
CREATE TRIGGER trg_decrement_stock AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();

-- ============================================================
-- FUNCTION: update customer totals on sale insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_customer_totals_on_sale()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET total_orders = total_orders + 1,
        total_purchases = total_purchases + NEW.total
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_customer_totals ON public.sales;
CREATE TRIGGER trg_update_customer_totals AFTER INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_totals_on_sale();

-- ============================================================
-- SEED: default settings row (required for invoice generation)
-- ============================================================
INSERT INTO public.settings (pharmacy_name, address, phone, email, currency, tax_rate, invoice_prefix, invoice_counter)
SELECT 'صيدلية الشفاء', '', '', '', 'ج.م', 14.00, 'INV', 1
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- ============================================================
-- STORAGE BUCKET for product images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth_read_product_images" ON storage.objects;
CREATE POLICY "auth_read_product_images" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_insert_product_images" ON storage.objects;
CREATE POLICY "auth_insert_product_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
CREATE POLICY "auth_update_product_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "auth_delete_product_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'product-images');