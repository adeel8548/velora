-- =============================================================================
-- VELORA — Order item sale price snapshot (original + discount at purchase)
-- Run in Supabase SQL Editor
-- =============================================================================

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS original_unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (original_unit_price >= 0);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS discount_percent INT NOT NULL DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100);

COMMENT ON COLUMN public.order_items.original_unit_price IS 'List price before discount at time of order';
COMMENT ON COLUMN public.order_items.discount_percent IS 'Discount % applied when customer purchased';

-- Backfill: assume paid price was full price if no discount recorded
UPDATE public.order_items
SET original_unit_price = unit_price
WHERE original_unit_price = 0 OR original_unit_price IS NULL;
