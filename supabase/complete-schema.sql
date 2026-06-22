-- =============================================================================
-- VELORA E-COMMERCE — COMPLETE SUPABASE SCHEMA (Single File)
-- =============================================================================
-- Project : Velora Fashion Store
-- Run in  : Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- AFTER RUNNING:
-- 1. Authentication → Users → Add user (admin@velora.com) for admin portal
-- 2. Then run the "PROMOTE ADMIN" block at the bottom of this file
-- 3. Storage → product-images bucket is created automatically below
-- 4. Frontend .env (Create React App):
--      REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
--      REACT_APP_SUPABASE_ANON_KEY=your_anon_or_publishable_key
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEAN SLATE (optional — comment out if you already have data)
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.admin_dashboard_stats CASCADE;
DROP VIEW IF EXISTS public.products_with_stock_level CASCADE;

DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.subcategories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;
DROP TYPE IF EXISTS public.stock_level CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

-- Simulated payment — no Stripe/PayPal (free, frontend-only validation)
CREATE TYPE public.payment_method AS ENUM (
  'card',           -- simulated card (demo checkout)
  'cod',            -- cash on delivery
  'bank_transfer'   -- manual bank transfer
);

-- Stock indicator: High / Medium / Low / Out
CREATE TYPE public.stock_level AS ENUM ('high', 'medium', 'low', 'out');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PROFILES (extends auth.users — role: admin vs user)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  address_line  TEXT,
  city          TEXT,
  state         TEXT,
  country       TEXT DEFAULT 'Pakistan',
  postal_code   TEXT,
  role          public.user_role NOT NULL DEFAULT 'user',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role  ON public.profiles(role);

COMMENT ON TABLE public.profiles IS 'User profile + admin/user role for portal routing';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CATEGORIES (Men, Women, Kids)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SUBCATEGORIES (Watch, Shoes, Glasses, Pants, Shirt, Shalwar Kameez)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE INDEX idx_subcategories_category ON public.subcategories(category_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PRODUCTS (admin CRUD + stock management)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE,
  description     TEXT,
  price           NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock           INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id  UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  -- Denormalized text fields (matches frontend filters: Men, Watch, etc.)
  category        TEXT,
  subcategory     TEXT,
  product_image   TEXT,
  images          TEXT[] DEFAULT '{}',
  rating          NUMERIC(3, 1) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
  reviews_count   INT DEFAULT 0,
  is_new          BOOLEAN DEFAULT FALSE,
  is_sale         BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category     ON public.products(category);
CREATE INDEX idx_products_subcategory  ON public.products(subcategory);
CREATE INDEX idx_products_category_id  ON public.products(category_id);
CREATE INDEX idx_products_stock        ON public.products(stock);
CREATE INDEX idx_products_active       ON public.products(is_active);
CREATE INDEX idx_products_created      ON public.products(created_at DESC);

COMMENT ON COLUMN public.products.stock IS 'Units in inventory. Level: high>20, medium 6-20, low 1-5, out=0';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ORDERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  order_number      TEXT NOT NULL UNIQUE,
  status            public.order_status NOT NULL DEFAULT 'pending',
  subtotal          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  -- Shipping snapshot
  shipping_first_name TEXT,
  shipping_last_name  TEXT,
  shipping_email      TEXT,
  shipping_phone      TEXT,
  shipping_address    TEXT,
  shipping_city       TEXT,
  shipping_state      TEXT,
  shipping_zip        TEXT,
  shipping_country    TEXT DEFAULT 'Pakistan',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user    ON public.orders(user_id);
CREATE INDEX idx_orders_status  ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ORDER ITEMS (line items + price snapshot at purchase)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  product_image TEXT,
  quantity      INT NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  line_total    NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. PAYMENTS (simulated — no third-party gateway, free demo checkout)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  method          public.payment_method NOT NULL DEFAULT 'card',
  status          public.payment_status NOT NULL DEFAULT 'pending',
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  -- Simulated card fields (last 4 only — NEVER store full card numbers in production)
  card_last_four  TEXT,
  card_brand      TEXT DEFAULT 'visa',
  transaction_ref TEXT UNIQUE,  -- e.g. VLR-20260318-XXXX (generated locally)
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order  ON public.payments(order_id);
CREATE INDEX idx_payments_user   ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

COMMENT ON TABLE public.payments IS 'Simulated payment records — no Stripe/PayPal. Card validated on frontend only.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Stock level: High (>20) | Medium (6-20) | Low (1-5) | Out (0)
CREATE OR REPLACE FUNCTION public.get_stock_level(qty INT)
RETURNS public.stock_level
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF qty IS NULL OR qty <= 0 THEN RETURN 'out'::public.stock_level;
  ELSIF qty <= 5  THEN RETURN 'low'::public.stock_level;
  ELSIF qty <= 20 THEN RETURN 'medium'::public.stock_level;
  ELSE               RETURN 'high'::public.stock_level;
  END IF;
END;
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Auto-generate order number: VLR-YYYYMMDD-0001
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  today TEXT;
  seq   INT;
BEGIN
  today := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq
  FROM public.orders
  WHERE order_number LIKE 'VLR-' || today || '-%';
  RETURN 'VLR-' || today || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$;

-- Auto-generate payment transaction ref
CREATE OR REPLACE FUNCTION public.generate_transaction_ref()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'PAY-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 12));
END;
$$;

-- Slugify helper
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LOWER(REGEXP_REPLACE(TRIM(input), '[^a-zA-Z0-9]+', '-', 'g'));
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create profile when new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user')
  );
  RETURN NEW;
END;
$$;

-- Deduct stock when order is confirmed (called from app or trigger)
CREATE OR REPLACE FUNCTION public.deduct_order_stock(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products p
  SET stock = GREATEST(0, p.stock - oi.quantity),
      updated_at = NOW()
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = p.id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. VIEWS (admin dashboard + product stock badges)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE VIEW public.products_with_stock_level AS
SELECT
  p.*,
  public.get_stock_level(p.stock) AS stock_level,
  CASE public.get_stock_level(p.stock)
    WHEN 'high'   THEN 'High Stock'
    WHEN 'medium' THEN 'Medium Stock'
    WHEN 'low'    THEN 'Low Stock'
    WHEN 'out'    THEN 'Out of Stock'
  END AS stock_label
FROM public.products p;

CREATE VIEW public.admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.products WHERE is_active = TRUE)                    AS total_products,
  (SELECT COUNT(*) FROM public.products WHERE public.get_stock_level(stock) = 'high')   AS stock_high,
  (SELECT COUNT(*) FROM public.products WHERE public.get_stock_level(stock) = 'medium') AS stock_medium,
  (SELECT COUNT(*) FROM public.products WHERE public.get_stock_level(stock) = 'low')    AS stock_low,
  (SELECT COUNT(*) FROM public.products WHERE public.get_stock_level(stock) = 'out')    AS stock_out,
  (SELECT COUNT(*) FROM public.orders)                                               AS total_orders,
  (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')                      AS pending_orders,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'user')                         AS total_users,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status != 'cancelled') AS total_revenue;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subcategories_updated_at
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto set order_number before insert
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_set_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments      ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());

-- CATEGORIES (public read, admin write)
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (public.is_admin());

-- SUBCATEGORIES
CREATE POLICY "subcategories_public_read" ON public.subcategories
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "subcategories_admin_write" ON public.subcategories
  FOR ALL USING (public.is_admin());

-- PRODUCTS (public read active, admin full CRUD)
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "products_admin_write" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE USING (public.is_admin());

-- ORDERS (users see own, admin sees all)
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE USING (public.is_admin());

-- ORDER ITEMS
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_admin" ON public.order_items
  FOR ALL USING (public.is_admin());

-- PAYMENTS
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. STORAGE (product images bucket)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Public read for product images
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Admin upload/update/delete
CREATE POLICY "product_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. SEED DATA — Categories & Subcategories
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Men',   'men',   'Premium men''s fashion — watches, shoes, shirts & more', 1),
  ('Women', 'women', 'Elegant women''s collection', 2),
  ('Kids',  'kids',  'Comfortable styles for children', 3)
ON CONFLICT (slug) DO NOTHING;

-- Subcategories for each category
INSERT INTO public.subcategories (category_id, name, slug, sort_order)
SELECT c.id, sub.name, sub.slug, sub.sort_order
FROM public.categories c
CROSS JOIN (
  VALUES
    ('Watch',          'watch',           1),
    ('Shoes',          'shoes',           2),
    ('Glasses',        'glasses',         3),
    ('Pants',          'pants',           4),
    ('Shirt',          'shirt',           5),
    ('Shalwar Kameez', 'shalwar-kameez',  6)
) AS sub(name, slug, sort_order)
ON CONFLICT (category_id, slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. SEED DATA — 25 Demo Products per Category (75 total)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  cat_rec   RECORD;
  sub_names TEXT[] := ARRAY['Watch','Shoes','Glasses','Pants','Shirt','Shalwar Kameez'];
  sub_slugs TEXT[] := ARRAY['watch','shoes','glasses','pants','shirt','shalwar-kameez'];
  img_urls  TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=600&fit=crop&q=80'
  ];
  i         INT;
  sub_idx   INT;
  sub_id    UUID;
  cat_id    UUID;
  pname     TEXT;
  pprice    NUMERIC;
  pstock    INT;
BEGIN
  FOR cat_rec IN SELECT id, name, slug FROM public.categories LOOP
    FOR i IN 1..25 LOOP
      sub_idx := ((i - 1) % 6) + 1;

      SELECT s.id INTO sub_id
      FROM public.subcategories s
      WHERE s.category_id = cat_rec.id AND s.slug = sub_slugs[sub_idx];

      cat_id := cat_rec.id;
      pname  := 'Velora ' || sub_names[sub_idx] || ' — ' || cat_rec.name || ' Vol.' || i;
      pprice := 1499 + (i * 275) + (CASE cat_rec.slug WHEN 'women' THEN 200 WHEN 'kids' THEN -100 ELSE 0 END);
      pstock := 5 + (i * 2);  -- varied stock for high/medium/low demo

      INSERT INTO public.products (
        name, slug, description, price, stock,
        category_id, subcategory_id, category, subcategory,
        product_image, images, rating, reviews_count, is_new, is_sale, is_active
      ) VALUES (
        pname,
        public.slugify(pname) || '-' || i,
        'Premium ' || sub_names[sub_idx] || ' from Velora ' || cat_rec.name || ' collection.',
        pprice,
        pstock,
        cat_id,
        sub_id,
        cat_rec.name,
        sub_names[sub_idx],
        img_urls[sub_idx],
        ARRAY[img_urls[sub_idx]],
        4.0 + (i % 10) * 0.1,
        20 + i * 3,
        i <= 4,
        i % 4 = 0,
        TRUE
      )
      ON CONFLICT (slug) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. GRANT ACCESS (required for Supabase API)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. PROMOTE FIRST ADMIN (run AFTER creating user in Supabase Auth)
-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Supabase → Authentication → Users → Add user
--         Email: admin@velora.com  |  Password: (your choice)
-- Step 2: Uncomment and run below (change email if needed):

/*
UPDATE public.profiles
SET role = 'admin', full_name = 'Velora Admin'
WHERE email = 'admin@velora.com';
*/

-- Verify admin:
-- SELECT id, email, role FROM public.profiles WHERE role = 'admin';

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. QUICK REFERENCE — Stock Levels
-- ─────────────────────────────────────────────────────────────────────────────
-- | Stock Qty | Level  | Label          | Badge Color (frontend) |
-- |-----------|--------|----------------|------------------------|
-- | 0         | out    | Out of Stock   | Red                    |
-- | 1 - 5     | low    | Low Stock      | Orange                 |
-- | 6 - 20    | medium | Medium Stock   | Yellow                 |
-- | 21+       | high   | High Stock     | Green                  |
--
-- Query products with stock level:
--   SELECT name, stock, stock_level, stock_label FROM products_with_stock_level;
--
-- Admin dashboard stats:
--   SELECT * FROM admin_dashboard_stats;
-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
