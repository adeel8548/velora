-- =============================================================================
-- SCHEDULED SALES — starts_at / ends_at (e.g. 14 August 12:00 AM)
-- Run in Supabase SQL Editor after promotions-schema.sql
-- =============================================================================

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_promotions_starts_at ON public.promotions(starts_at);
CREATE INDEX IF NOT EXISTS idx_promotions_ends_at ON public.promotions(ends_at);

COMMENT ON COLUMN public.promotions.starts_at IS 'Sale start — NULL = start immediately';
COMMENT ON COLUMN public.promotions.ends_at IS 'Sale end — NULL = no end date';

-- Sync all promotions: apply LIVE, remove UPCOMING/ENDED
CREATE OR REPLACE FUNCTION public.sync_scheduled_promotions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo  public.promotions;
  v_count  INT := 0;
BEGIN
  FOR v_promo IN
    SELECT * FROM public.promotions
    WHERE is_active = FALSE
       OR (ends_at IS NOT NULL AND NOW() >= ends_at)
  LOOP
    PERFORM public.apply_promotion_to_products(
      v_promo.apply_to,
      v_promo.product_id,
      v_promo.category,
      v_promo.subcategory,
      v_promo.discount_percent,
      FALSE
    );
    v_count := v_count + 1;
  END LOOP;

  FOR v_promo IN
    SELECT * FROM public.promotions
    WHERE is_active = TRUE
      AND (starts_at IS NULL OR NOW() >= starts_at)
      AND (ends_at IS NULL OR NOW() < ends_at)
    ORDER BY starts_at NULLS FIRST, created_at ASC
  LOOP
    PERFORM public.apply_promotion_to_products(
      v_promo.apply_to,
      v_promo.product_id,
      v_promo.category,
      v_promo.subcategory,
      v_promo.discount_percent,
      TRUE
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_scheduled_promotions() TO anon, authenticated;

DROP POLICY IF EXISTS "promotions_public_read" ON public.promotions;
CREATE POLICY "promotions_public_read" ON public.promotions
  FOR SELECT USING (
    (is_active = TRUE AND (ends_at IS NULL OR ends_at > NOW()))
    OR public.is_admin()
  );
