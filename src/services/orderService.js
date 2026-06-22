import { supabase } from "../lib/supabase";
import { mapOrder } from "../lib/mappers";

export async function fetchUserOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((o) => mapOrder(o, o.order_items || []));
}

export async function fetchAllOrdersAdmin() {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(*, products(cost_price)),
      profiles(full_name, email, phone, address_line, city, state)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((o) => ({
    ...mapOrder(o, o.order_items || []),
    user: o.profiles
      ? {
          name: o.profiles.full_name,
          email: o.profiles.email,
          phone: o.profiles.phone,
          addressLine: o.profiles.address_line,
          city: o.profiles.city,
          state: o.profiles.state,
        }
      : null,
    __userDetailCard: {
      name: o.profiles?.full_name || "Unknown",
      email: o.profiles?.email || "N/A",
      phone: o.profiles?.phone || "N/A",
      address: o.profiles?.address_line || "N/A",
      city: o.profiles?.city || "N/A",
      state: o.profiles?.state || "N/A",
    },
  }));
}

export async function placeOrder({
  userId,
  cartItems,
  shipping,
  totals,
  paymentMethod = "card",
  cardNumber = "",
}) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "confirmed",
      subtotal: totals.subtotal,
      tax_amount: totals.tax,
      shipping_amount: totals.shipping,
      total_amount: totals.total,
      shipping_first_name: shipping.firstName,
      shipping_last_name: shipping.lastName,
      shipping_email: shipping.email,
      shipping_phone: shipping.phone,
      shipping_address: shipping.address,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_zip: shipping.zipCode,
      shipping_country: shipping.country || "Pakistan",
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const productIds = cartItems.map((item) => item.product).filter(Boolean);
  const costByProduct = {};

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, cost_price")
      .in("id", productIds);

    (products || []).forEach((p) => {
      costByProduct[p.id] = Number(p.cost_price ?? 0);
    });
  }

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product,
    product_name: item.name,
    product_image: item.image,
    quantity: item.quantity,
    unit_price: item.price,
    original_unit_price: item.originalPrice ?? item.price,
    discount_percent: item.discountPercent ?? 0,
    unit_cost: costByProduct[item.product] ?? 0,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw itemsError;

  const transactionRef = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { error: payError } = await supabase.from("payments").insert({
    order_id: order.id,
    user_id: userId,
    method: paymentMethod,
    status: "completed",
    amount: totals.total,
    card_last_four: cardNumber ? cardNumber.slice(-4) : null,
    card_brand: "visa",
    transaction_ref: transactionRef,
    paid_at: new Date().toISOString(),
  });

  if (payError) throw payError;

  await supabase.rpc("deduct_order_stock", { p_order_id: order.id });

  return mapOrder(order, orderItems.map((i, idx) => ({ ...i, id: idx })));
}
