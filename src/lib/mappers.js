/** Map Supabase row → frontend product shape (_id for legacy components) */
export function getProductPricing(product) {
  const originalPrice = Number(product?.price ?? 0);
  const discountPercent = Number(
    product?.discountPercent ?? product?.discount_percent ?? 0,
  );
  const isSale =
    Boolean(product?.isSale ?? product?.is_sale) && discountPercent > 0;
  const salePrice = isSale
    ? Math.round(originalPrice * (1 - discountPercent / 100))
    : originalPrice;

  return { originalPrice, salePrice, discountPercent, isSale };
}

export function mapProduct(row) {
  if (!row) return null;
  const pricing = getProductPricing({
    price: row.price,
    discount_percent: row.discount_percent,
    is_sale: row.is_sale,
  });

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description,
    price: pricing.salePrice,
    originalPrice: pricing.originalPrice,
    salePrice: pricing.salePrice,
    discountPercent: pricing.discountPercent,
    stock: row.stock ?? 0,
    category: row.category,
    subcategory: row.subcategory,
    category_id: row.category_id,
    subcategory_id: row.subcategory_id,
    productImage: row.product_image,
    product_image: row.product_image,
    images: row.images || [],
    rating: row.rating,
    reviews: row.reviews_count,
    reviews_count: row.reviews_count,
    isNew: row.is_new,
    isSale: pricing.isSale,
    is_active: row.is_active,
    stockLevel: row.stock_level,
    stockLabel: row.stock_label,
    createdAt: row.created_at,
    created_at: row.created_at,
  };
}

export function mapProfile(profile, authUser) {
  if (!profile && !authUser) return null;
  const meta = authUser?.user_metadata || {};
  const p = profile || {};

  return {
    _id: p.id || authUser?.id,
    id: p.id || authUser?.id,
    email: p.email || authUser?.email,
    name: p.full_name || meta.full_name || meta.name || "",
    full_name: p.full_name || meta.full_name || meta.name || "",
    phone: p.phone || meta.phone || "",
    addressLine: p.address_line || meta.address_line || "",
    address_line: p.address_line || meta.address_line || "",
    city: p.city || meta.city || "",
    state: p.state || meta.state || "",
    country: p.country || meta.country || "Pakistan",
    postalCode: p.postal_code || meta.postal_code || "",
    postal_code: p.postal_code || meta.postal_code || "",
    role: p.role || meta.role || "user",
    avatar_url: p.avatar_url || meta.avatar_url || "",
    createdAt: p.created_at,
    created_at: p.created_at,
  };
}

export function mapOrder(row, items = []) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    order_number: row.order_number,
    user_id: row.user_id,
    status: row.status,
    subtotal: Number(row.subtotal),
    taxAmount: Number(row.tax_amount),
    tax_amount: Number(row.tax_amount),
    shippingAmount: Number(row.shipping_amount),
    shipping_amount: Number(row.shipping_amount),
    totalAmount: Number(row.total_amount),
    total_amount: Number(row.total_amount),
    createdAt: row.created_at,
    created_at: row.created_at,
    shippingAddress: {
      firstName: row.shipping_first_name,
      lastName: row.shipping_last_name,
      email: row.shipping_email,
      phone: row.shipping_phone,
      address: row.shipping_address,
      city: row.shipping_city,
      state: row.shipping_state,
      zipCode: row.shipping_zip,
      country: row.shipping_country,
    },
    items: items.map(mapOrderItem),
  };
}

function mapOrderItem(item) {
  return {
    _id: item.id,
    product: item.product_id,
    product_id: item.product_id,
    productName: item.product_name,
    product_name: item.product_name,
    productImage: item.product_image,
    quantity: item.quantity,
    price: Number(item.unit_price),
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
  };
}

export function getStockBadge(stock, stockLevel) {
  const level =
    stockLevel ||
    (stock <= 0 ? "out" : stock <= 5 ? "low" : stock <= 20 ? "medium" : "high");

  const config = {
    high: { label: "High Stock", className: "bg-emerald-100 text-emerald-800" },
    medium: { label: "Medium Stock", className: "bg-amber-100 text-amber-800" },
    low: { label: "Low Stock", className: "bg-orange-100 text-orange-800" },
    out: { label: "Out of Stock", className: "bg-red-100 text-red-800" },
  };

  return { ...(config[level] || config.out), level, qty: stock };
}
