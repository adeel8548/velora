-- =============================================================================
-- VELORA — COST PRICE & PROFIT TRACKING
-- Run in Supabase SQL Editor (after complete-schema.sql + velora-extensions-schema.sql)
-- =============================================================================
-- cost_price  = what you pay / product cost (e.g. Rs. 1500)
-- unit_price  = what customer paid on web (e.g. Rs. 2000)
-- profit      = (unit_price - cost_price) × quantity
-- =============================================================================

-- Product purchase / cost price (admin only — not shown on storefront)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (cost_price >= 0);

COMMENT ON COLUMN public.products.cost_price IS 'Admin cost/purchase price. Profit = sale unit_price - cost_price';

-- Snapshot cost at time of order
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (unit_cost >= 0);

COMMENT ON COLUMN public.order_items.unit_cost IS 'Product cost_price snapshot when order was placed';

-- Sales ledger profit columns
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (unit_cost >= 0);

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS line_profit NUMERIC(12, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.sales.line_profit IS '(unit_price - unit_cost) × quantity';

-- Backfill order_items unit_cost from current product cost_price
UPDATE public.order_items oi
SET unit_cost = COALESCE(p.cost_price, 0)
FROM public.products p
WHERE p.id = oi.product_id
  AND oi.unit_cost = 0
  AND COALESCE(p.cost_price, 0) > 0;

-- Backfill sales profit
UPDATE public.sales s
SET
  unit_cost = COALESCE(oi.unit_cost, p.cost_price, 0),
  line_profit = (s.unit_price - COALESCE(oi.unit_cost, p.cost_price, 0)) * s.quantity
FROM public.order_items oi
LEFT JOIN public.products p ON p.id = s.product_id
WHERE oi.id = s.order_item_id;

-- Update sale recording trigger to include cost & profit
CREATE OR REPLACE FUNCTION public.record_sale_from_order_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order     public.orders;
  v_profile   public.profiles;
  v_cat       TEXT;
  v_sub       TEXT;
  v_unit_cost NUMERIC(12, 2);
  v_profit    NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
  IF v_order IS NULL OR v_order.status = 'cancelled' THEN RETURN NEW; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_order.user_id;
  SELECT p.category, p.subcategory, COALESCE(NEW.unit_cost, p.cost_price, 0)
    INTO v_cat, v_sub, v_unit_cost
  FROM public.products p WHERE p.id = NEW.product_id;

  IF v_unit_cost IS NULL THEN v_unit_cost := COALESCE(NEW.unit_cost, 0); END IF;
  v_profit := (NEW.unit_price - v_unit_cost) * NEW.quantity;

  INSERT INTO public.sales (
    order_id, order_item_id, user_id, order_number, order_status,
    customer_name, customer_email, product_id, product_name,
    category, subcategory, quantity, unit_price, unit_cost, line_total, line_profit, sale_date
  )
  VALUES (
    NEW.order_id, NEW.id, v_order.user_id, v_order.order_number, v_order.status,
    v_profile.full_name, v_profile.email, NEW.product_id, NEW.product_name,
    COALESCE(v_cat, 'Other'), COALESCE(v_sub, 'General'),
    NEW.quantity, NEW.unit_price, v_unit_cost, NEW.quantity * NEW.unit_price, v_profit,
    COALESCE(v_order.created_at, NOW())
  )
  ON CONFLICT (order_item_id) DO UPDATE SET
    order_status = EXCLUDED.order_status,
    quantity = EXCLUDED.quantity,
    unit_price = EXCLUDED.unit_price,
    unit_cost = EXCLUDED.unit_cost,
    line_total = EXCLUDED.line_total,
    line_profit = EXCLUDED.line_profit;

  RETURN NEW;
END;
$$;

-- Profit summary view for dashboard
CREATE OR REPLACE VIEW public.admin_profit_summary AS
SELECT
  COALESCE(SUM(line_profit), 0)     AS total_profit,
  COALESCE(SUM(line_total), 0)      AS total_revenue,
  COALESCE(SUM(quantity), 0)::INT   AS total_units,
  COUNT(DISTINCT order_id)::INT     AS total_orders
FROM public.sales
WHERE order_status != 'cancelled';

GRANT SELECT ON public.admin_profit_summary TO authenticated;
