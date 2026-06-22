-- =============================================================================
-- SALES TABLE — Velora Admin Sales Page
-- Run in Supabase SQL Editor (after complete-schema.sql)
-- Auto-records each order line item; powers /admin/sales
-- =============================================================================

-- 1. Sales table (one row per sold line item)
CREATE TABLE IF NOT EXISTS public.sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id   UUID UNIQUE REFERENCES public.order_items(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number    TEXT NOT NULL,
  order_status    public.order_status NOT NULL DEFAULT 'confirmed',
  customer_name   TEXT,
  customer_email  TEXT,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  category        TEXT,
  subcategory     TEXT,
  quantity        INT NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  line_total      NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
  sale_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_sale_date    ON public.sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_order_id     ON public.sales(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_category     ON public.sales(category);
CREATE INDEX IF NOT EXISTS idx_sales_subcategory  ON public.sales(subcategory);
CREATE INDEX IF NOT EXISTS idx_sales_order_status ON public.sales(order_status);

COMMENT ON TABLE public.sales IS 'Denormalized sales ledger — one row per order line item for admin reporting';

-- 2. Record sale when order item is inserted
CREATE OR REPLACE FUNCTION public.record_sale_from_order_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order   public.orders;
  v_profile public.profiles;
  v_cat     TEXT;
  v_sub     TEXT;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
  IF v_order IS NULL OR v_order.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_order.user_id;

  SELECT p.category, p.subcategory INTO v_cat, v_sub
  FROM public.products p WHERE p.id = NEW.product_id;

  INSERT INTO public.sales (
    order_id,
    order_item_id,
    user_id,
    order_number,
    order_status,
    customer_name,
    customer_email,
    product_id,
    product_name,
    category,
    subcategory,
    quantity,
    unit_price,
    line_total,
    sale_date
  )
  VALUES (
    NEW.order_id,
    NEW.id,
    v_order.user_id,
    v_order.order_number,
    v_order.status,
    v_profile.full_name,
    v_profile.email,
    NEW.product_id,
    NEW.product_name,
    COALESCE(v_cat, 'Other'),
    COALESCE(v_sub, 'General'),
    NEW.quantity,
    NEW.unit_price,
    NEW.quantity * NEW.unit_price,
    COALESCE(v_order.created_at, NOW())
  )
  ON CONFLICT (order_item_id) DO UPDATE SET
    order_status  = EXCLUDED.order_status,
    quantity      = EXCLUDED.quantity,
    unit_price    = EXCLUDED.unit_price,
    line_total    = EXCLUDED.line_total,
    product_name  = EXCLUDED.product_name,
    category      = EXCLUDED.category,
    subcategory   = EXCLUDED.subcategory;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_sale ON public.order_items;
CREATE TRIGGER trg_record_sale
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.record_sale_from_order_item();

-- 3. Sync order status changes to sales rows
CREATE OR REPLACE FUNCTION public.sync_sales_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sales
  SET order_status = NEW.status
  WHERE order_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_sales_status ON public.orders;
CREATE TRIGGER trg_sync_sales_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_sales_order_status();

-- 4. RLS — admin reads all; users see own sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_admin_all" ON public.sales;
CREATE POLICY "sales_admin_all" ON public.sales
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_select_own" ON public.sales;
CREATE POLICY "sales_select_own" ON public.sales
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Backfill from existing orders (run once)
INSERT INTO public.sales (
  order_id,
  order_item_id,
  user_id,
  order_number,
  order_status,
  customer_name,
  customer_email,
  product_id,
  product_name,
  category,
  subcategory,
  quantity,
  unit_price,
  line_total,
  sale_date
)
SELECT
  o.id,
  oi.id,
  o.user_id,
  o.order_number,
  o.status,
  pr.full_name,
  pr.email,
  oi.product_id,
  oi.product_name,
  COALESCE(p.category, 'Other'),
  COALESCE(p.subcategory, 'General'),
  oi.quantity,
  oi.unit_price,
  oi.line_total,
  o.created_at
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
LEFT JOIN public.profiles pr ON pr.id = o.user_id
LEFT JOIN public.products p ON p.id = oi.product_id
WHERE o.status != 'cancelled'
ON CONFLICT (order_item_id) DO NOTHING;

-- 6. Grants
GRANT SELECT ON public.sales TO authenticated;
GRANT ALL ON public.sales TO authenticated;

-- Verify:
-- SELECT COUNT(*) FROM public.sales;
-- SELECT * FROM public.sales ORDER BY sale_date DESC LIMIT 10;
