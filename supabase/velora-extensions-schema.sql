-- =============================================================================
-- VELORA — EXTENSIONS SCHEMA (run after complete-schema.sql)
-- Includes: product discount fields, promotions (scheduled sales), order sales ledger
-- =============================================================================
-- Run order:
--   1. complete-schema.sql
--   2. fix-profiles.sql (optional)
--   3. THIS FILE (velora-extensions-schema.sql)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- A. PRODUCTS — new / changed columns
-- ─────────────────────────────────────────────────────────────────────────────
-- Existing in complete-schema.sql: is_sale BOOLEAN
-- Added here:
--   discount_percent — active % off (used with is_sale on storefront)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percent INT NOT NULL DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100);

COMMENT ON COLUMN public.products.is_sale IS 'TRUE when product has an active promotional discount';
COMMENT ON COLUMN public.products.discount_percent IS 'Discount % (0–100). Sale price = price * (1 - discount_percent/100)';

-- ─────────────────────────────────────────────────────────────────────────────
-- B. PROMOTIONS — sale offers (product / brand-category / subcategory)
-- ─────────────────────────────────────────────────────────────────────────────
-- Admin applies: "20% off Men" or single product, with start & END date/time

CREATE TABLE IF NOT EXISTS public.promotions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  apply_to          TEXT NOT NULL CHECK (apply_to IN ('product', 'category', 'subcategory')),
  product_id        UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name      TEXT,
  category          TEXT,          -- Men | Women | Kids (brand/category)
  subcategory       TEXT,          -- Watch, Shoes, etc.
  discount_percent  INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at         TIMESTAMPTZ,   -- NULL = start immediately
  ends_at           TIMESTAMPTZ,   -- NULL = no end; when reached sale auto-stops
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_active    ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_apply_to  ON public.promotions(apply_to);
CREATE INDEX IF NOT EXISTS idx_promotions_category  ON public.promotions(category);
CREATE INDEX IF NOT EXISTS idx_promotions_starts_at ON public.promotions(starts_at);
CREATE INDEX IF NOT EXISTS idx_promotions_ends_at   ON public.promotions(ends_at);

COMMENT ON TABLE public.promotions IS 'Promotional sale offers — admin sets product/category discount with start & end datetime';
COMMENT ON COLUMN public.promotions.starts_at IS 'When sale goes LIVE (e.g. 14 Aug 2025 00:00)';
COMMENT ON COLUMN public.promotions.ends_at IS 'When sale ENDS automatically — discount removed from products';

-- Apply / remove discount on matching products
CREATE OR REPLACE FUNCTION public.apply_promotion_to_products(
  p_apply_to         TEXT,
  p_product_id       UUID,
  p_category         TEXT,
  p_subcategory      TEXT,
  p_discount_percent INT,
  p_is_active        BOOLEAN
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF p_is_active AND p_discount_percent > 0 THEN
    UPDATE public.products
    SET is_sale = TRUE, discount_percent = p_discount_percent, updated_at = NOW()
    WHERE (p_apply_to = 'product' AND id = p_product_id)
       OR (p_apply_to = 'category' AND category = p_category)
       OR (p_apply_to = 'subcategory' AND category = p_category AND subcategory = p_subcategory);
    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    UPDATE public.products
    SET is_sale = FALSE, discount_percent = 0, updated_at = NOW()
    WHERE (p_apply_to = 'product' AND id = p_product_id)
       OR (p_apply_to = 'category' AND category = p_category)
       OR (p_apply_to = 'subcategory' AND category = p_category AND subcategory = p_subcategory);
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;
  RETURN v_count;
END;
$$;

-- Auto activate/deactivate by starts_at & ends_at
CREATE OR REPLACE FUNCTION public.sync_scheduled_promotions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo public.promotions;
  v_count INT := 0;
BEGIN
  -- Remove ended or disabled
  FOR v_promo IN
    SELECT * FROM public.promotions
    WHERE is_active = FALSE OR (ends_at IS NOT NULL AND NOW() >= ends_at)
  LOOP
    PERFORM public.apply_promotion_to_products(
      v_promo.apply_to, v_promo.product_id, v_promo.category, v_promo.subcategory,
      v_promo.discount_percent, FALSE
    );
    v_count := v_count + 1;
  END LOOP;

  -- Apply live (started & not ended)
  FOR v_promo IN
    SELECT * FROM public.promotions
    WHERE is_active = TRUE
      AND (starts_at IS NULL OR NOW() >= starts_at)
      AND (ends_at IS NULL OR NOW() < ends_at)
    ORDER BY starts_at NULLS FIRST, created_at ASC
  LOOP
    PERFORM public.apply_promotion_to_products(
      v_promo.apply_to, v_promo.product_id, v_promo.category, v_promo.subcategory,
      v_promo.discount_percent, TRUE
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_promotion_to_products TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_scheduled_promotions() TO anon, authenticated;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_public_read" ON public.promotions;
CREATE POLICY "promotions_public_read" ON public.promotions
  FOR SELECT USING (
    (is_active = TRUE AND (ends_at IS NULL OR ends_at > NOW()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "promotions_admin_write" ON public.promotions;
CREATE POLICY "promotions_admin_write" ON public.promotions
  FOR ALL USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- C. SALES — order revenue ledger (one row per sold line item)
-- ─────────────────────────────────────────────────────────────────────────────

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

COMMENT ON TABLE public.sales IS 'Order sales ledger for admin dashboard & reports';

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
  IF v_order IS NULL OR v_order.status = 'cancelled' THEN RETURN NEW; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_order.user_id;
  SELECT p.category, p.subcategory INTO v_cat, v_sub FROM public.products p WHERE p.id = NEW.product_id;

  INSERT INTO public.sales (
    order_id, order_item_id, user_id, order_number, order_status,
    customer_name, customer_email, product_id, product_name,
    category, subcategory, quantity, unit_price, line_total, sale_date
  )
  VALUES (
    NEW.order_id, NEW.id, v_order.user_id, v_order.order_number, v_order.status,
    v_profile.full_name, v_profile.email, NEW.product_id, NEW.product_name,
    COALESCE(v_cat, 'Other'), COALESCE(v_sub, 'General'),
    NEW.quantity, NEW.unit_price, NEW.quantity * NEW.unit_price,
    COALESCE(v_order.created_at, NOW())
  )
  ON CONFLICT (order_item_id) DO UPDATE SET
    order_status = EXCLUDED.order_status,
    quantity = EXCLUDED.quantity,
    unit_price = EXCLUDED.unit_price,
    line_total = EXCLUDED.line_total;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_sales_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sales SET order_status = NEW.status WHERE order_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_sale ON public.order_items;
CREATE TRIGGER trg_record_sale
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.record_sale_from_order_item();

DROP TRIGGER IF EXISTS trg_sync_sales_status ON public.orders;
CREATE TRIGGER trg_sync_sales_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_sales_order_status();

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_admin_all" ON public.sales;
CREATE POLICY "sales_admin_all" ON public.sales
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_select_own" ON public.sales;
CREATE POLICY "sales_select_own" ON public.sales
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.sales TO authenticated;

-- Backfill sales from existing orders
INSERT INTO public.sales (
  order_id, order_item_id, user_id, order_number, order_status,
  customer_name, customer_email, product_id, product_name,
  category, subcategory, quantity, unit_price, line_total, sale_date
)
SELECT
  o.id, oi.id, o.user_id, o.order_number, o.status,
  pr.full_name, pr.email, oi.product_id, oi.product_name,
  COALESCE(p.category, 'Other'), COALESCE(p.subcategory, 'General'),
  oi.quantity, oi.unit_price, oi.line_total, o.created_at
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
LEFT JOIN public.profiles pr ON pr.id = o.user_id
LEFT JOIN public.products p ON p.id = oi.product_id
WHERE o.status != 'cancelled'
ON CONFLICT (order_item_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- D. ADMIN VIEWS (optional helpers for dashboard)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_promotions_summary AS
SELECT
  id,
  title,
  apply_to,
  product_name,
  category,
  subcategory,
  discount_percent,
  is_active,
  starts_at,
  ends_at,
  CASE
    WHEN NOT is_active THEN 'disabled'
    WHEN starts_at IS NOT NULL AND NOW() < starts_at THEN 'upcoming'
    WHEN ends_at IS NOT NULL AND NOW() >= ends_at THEN 'ended'
    ELSE 'live'
  END AS schedule_status,
  created_at
FROM public.promotions
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW public.admin_sales_summary AS
SELECT
  COUNT(*)::INT                    AS total_line_items,
  COALESCE(SUM(line_total), 0)     AS total_revenue,
  COALESCE(SUM(quantity), 0)::INT  AS total_units,
  COUNT(DISTINCT order_id)::INT    AS total_orders
FROM public.sales
WHERE order_status != 'cancelled';

GRANT SELECT ON public.admin_promotions_summary TO authenticated;
GRANT SELECT ON public.admin_sales_summary TO authenticated;

-- =============================================================================
-- VERIFY
-- =============================================================================
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'products' AND column_name IN ('is_sale', 'discount_percent');
-- SELECT * FROM public.promotions;
-- SELECT * FROM public.sales ORDER BY sale_date DESC LIMIT 10;
-- SELECT * FROM public.admin_sales_summary;
-- SELECT public.sync_scheduled_promotions();
-- =============================================================================
