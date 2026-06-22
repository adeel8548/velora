-- =============================================================================
-- PROMOTIONS — Product / Category (Brand) / Subcategory sale discounts
-- Run in Supabase SQL Editor after complete-schema.sql
-- Admin: /admin/sales — "kis product ya brand par sale lagi hai"
-- =============================================================================

-- 1. Discount field on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percent INT NOT NULL DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100);

COMMENT ON COLUMN public.products.discount_percent IS 'Active discount % — used with is_sale for storefront pricing';

-- 2. Promotions log (what admin applied and where)
CREATE TABLE IF NOT EXISTS public.promotions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  apply_to          TEXT NOT NULL CHECK (apply_to IN ('product', 'category', 'subcategory')),
  product_id        UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name      TEXT,
  category          TEXT,
  subcategory       TEXT,
  discount_percent  INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_active   ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_apply_to ON public.promotions(apply_to);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON public.promotions(category);

COMMENT ON TABLE public.promotions IS 'Sale offers applied by admin — product, category (Men/Women/Kids), or subcategory';

-- 3. Apply promotion to matching products
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
    SET
      is_sale = TRUE,
      discount_percent = p_discount_percent,
      updated_at = NOW()
    WHERE
      (p_apply_to = 'product' AND id = p_product_id)
      OR (p_apply_to = 'category' AND category = p_category)
      OR (p_apply_to = 'subcategory' AND category = p_category AND subcategory = p_subcategory);

    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    UPDATE public.products
    SET
      is_sale = FALSE,
      discount_percent = 0,
      updated_at = NOW()
    WHERE
      (p_apply_to = 'product' AND id = p_product_id)
      OR (p_apply_to = 'category' AND category = p_category)
      OR (p_apply_to = 'subcategory' AND category = p_category AND subcategory = p_subcategory);

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_promotion_to_products TO authenticated;

-- 4. RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_public_read" ON public.promotions;
CREATE POLICY "promotions_public_read" ON public.promotions
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "promotions_admin_write" ON public.promotions;
CREATE POLICY "promotions_admin_write" ON public.promotions
  FOR ALL USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;

-- Verify:
-- SELECT * FROM public.promotions ORDER BY created_at DESC;
-- SELECT name, category, is_sale, discount_percent FROM public.products WHERE is_sale = TRUE;
