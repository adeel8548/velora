import { supabase } from "../lib/supabase";

export function promotionTargetLabel(p) {
  if (p.apply_to === "product") {
    return p.product_name || "Single Product";
  }
  if (p.apply_to === "category") {
    return `Brand / Category: ${p.category}`;
  }
  if (p.apply_to === "subcategory") {
    return `${p.category} → ${p.subcategory}`;
  }
  return "—";
}

/** Combine date + time inputs → ISO string (local timezone) */
export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr?.trim()) return null;
  const time = timeStr?.trim() || "00:00";
  const d = new Date(`${dateStr}T${time}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function getPromotionScheduleStatus(promo, now = new Date()) {
  if (!promo?.is_active) return "disabled";

  const start = promo.starts_at ? new Date(promo.starts_at) : null;
  const end = promo.ends_at ? new Date(promo.ends_at) : null;

  if (start && now < start) return "upcoming";
  if (end && now >= end) return "ended";
  return "live";
}

export function isPromotionLive(promo, now = new Date()) {
  return getPromotionScheduleStatus(promo, now) === "live";
}

export function formatPromotionSchedule(promo) {
  const start = promo.starts_at ? new Date(promo.starts_at) : null;
  const end = promo.ends_at ? new Date(promo.ends_at) : null;

  const fmtDate = (d) =>
    d.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const fmtTime = (d) =>
    d.toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (start && end) {
    return `${fmtDate(start)} ${fmtTime(start)} → ${fmtDate(end)} ${fmtTime(end)}`;
  }
  if (start) {
    return `${fmtDate(start)} at ${fmtTime(start)}`;
  }
  return "Starts immediately";
}

export function formatUpcomingLabel(promo) {
  if (!promo.starts_at) return promo.title;
  const d = new Date(promo.starts_at);
  const dateStr = d.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
  });
  const timeStr = d.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Upcoming sale on ${dateStr} at ${timeStr} — ${promo.discount_percent}% OFF ${promotionTargetLabel(promo)}`;
}

export function getScheduleStatusBadge(status) {
  const map = {
    upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-700" },
    live: { label: "Live", className: "bg-emerald-100 text-emerald-700" },
    ended: { label: "Ended", className: "bg-slate-100 text-slate-500" },
    disabled: { label: "Disabled", className: "bg-red-100 text-red-600" },
  };
  return map[status] || map.disabled;
}

/** Run server-side sync — activates sales when start time hits */
export async function syncScheduledPromotions() {
  try {
    await supabase.rpc("sync_scheduled_promotions");
  } catch {
    /* RPC may not exist yet */
  }
}

export async function fetchPromotions() {
  await syncScheduledPromotions();

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchUpcomingPromotions() {
  await syncScheduledPromotions();

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .not("starts_at", "is", null)
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  if (error) throw error;
  return data || [];
}

export async function fetchLivePromotions() {
  const promos = await fetchPromotions();
  const now = new Date();
  return promos.filter((p) => isPromotionLive(p, now));
}

async function applyToProducts(promotion, shouldApply) {
  const active = shouldApply && promotion.discount_percent > 0;

  const { error } = await supabase.rpc("apply_promotion_to_products", {
    p_apply_to: promotion.apply_to,
    p_product_id: promotion.product_id || null,
    p_category: promotion.category || null,
    p_subcategory: promotion.subcategory || null,
    p_discount_percent: promotion.discount_percent,
    p_is_active: active,
  });

  if (error) {
    let query = supabase.from("products").update({
      is_sale: active,
      discount_percent: active ? promotion.discount_percent : 0,
    });

    if (promotion.apply_to === "product" && promotion.product_id) {
      query = query.eq("id", promotion.product_id);
    } else if (promotion.apply_to === "category" && promotion.category) {
      query = query.eq("category", promotion.category);
    } else if (
      promotion.apply_to === "subcategory" &&
      promotion.category &&
      promotion.subcategory
    ) {
      query = query
        .eq("category", promotion.category)
        .eq("subcategory", promotion.subcategory);
    }

    const { error: updateErr } = await query;
    if (updateErr) throw updateErr;
  }
}

export async function createPromotion({
  title,
  applyTo,
  productId,
  productName,
  category,
  subcategory,
  discountPercent,
  notes,
  startsAt,
  endsAt,
  startImmediately,
}) {
  const row = {
    title: title.trim(),
    apply_to: applyTo,
    product_id: applyTo === "product" ? productId : null,
    product_name: applyTo === "product" ? productName : null,
    category: applyTo !== "product" ? category : null,
    subcategory: applyTo === "subcategory" ? subcategory : null,
    discount_percent: Number(discountPercent),
    is_active: true,
    notes: notes?.trim() || null,
    starts_at: startImmediately ? new Date().toISOString() : startsAt,
    ends_at: endsAt || null,
  };

  const { data, error } = await supabase
    .from("promotions")
    .insert(row)
    .select()
    .single();

  if (error) throw error;

  if (isPromotionLive(data)) {
    await applyToProducts(data, true);
  }

  return data;
}

export async function togglePromotion(id, isActive, promotion) {
  const { data, error } = await supabase
    .from("promotions")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await syncScheduledPromotions();
  return data;
}

export async function deletePromotion(promotion) {
  const { error } = await supabase.from("promotions").delete().eq("id", promotion.id);
  if (error) throw error;

  await applyToProducts(promotion, false);
  await syncScheduledPromotions();
}
