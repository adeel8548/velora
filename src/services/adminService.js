import { supabase } from "../lib/supabase";
import { mapProfile } from "../lib/mappers";

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((p) => mapProfile(p, { id: p.id, email: p.email }));
}

export async function updateUserRole(userId, role) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return mapProfile(data, { id: data.id, email: data.email });
}

export async function fetchDashboardStats() {
  const { data, error } = await supabase
    .from("admin_dashboard_stats")
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

function getPeriodStart(period) {
  const now = new Date();
  const start = new Date(now);

  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    start.setDate(now.getDate() - 7);
  } else if (period === "monthly") {
    start.setMonth(now.getMonth() - 1);
  } else {
    start.setFullYear(2000);
  }

  return start.toISOString();
}

export async function fetchSalesAnalytics({
  period = "monthly",
  category = "",
  subcategory = "",
} = {}) {
  try {
    const { rows, summary } = await fetchSalesFromTable({ period, category, subcategory });

    const dailySales = {};
    const categoryBreakdown = {};
    const ordersSeen = new Set();

    rows.forEach((row) => {
      ordersSeen.add(row.orderId);

      const key = `${row.category} / ${row.subcategory}`;
      categoryBreakdown[key] = (categoryBreakdown[key] || 0) + row.lineTotal;

      const dayKey = new Date(row.date).toLocaleDateString("en-PK", {
        month: "short",
        day: "numeric",
      });
      dailySales[dayKey] = (dailySales[dayKey] || 0) + row.lineTotal;
    });

    const chartData = Object.entries(dailySales)
      .map(([label, value]) => ({ label, value }))
      .slice(-14);

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, revenue]) => ({ name, revenue }));

    const periodStart = getPeriodStart(period);
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, status, created_at")
      .gte("created_at", periodStart)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(8);

    return {
      totalRevenue: summary.totalRevenue,
      totalOrders: summary.totalOrders,
      totalItems: summary.totalItems,
      chartData,
      topCategories,
      recentOrders: recentOrders || [],
    };
  } catch {
    return fetchSalesAnalyticsFromOrders({ period, category, subcategory });
  }
}

async function fetchSalesAnalyticsFromOrders({
  period = "monthly",
  category = "",
  subcategory = "",
} = {}) {
  const periodStart = getPeriodStart(period);

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total_amount,
      status,
      created_at,
      order_items(
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        line_total,
        products(category, subcategory)
      )
    `)
    .gte("created_at", periodStart)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (error) throw error;

  let filteredOrders = orders || [];

  if (category || subcategory) {
    filteredOrders = filteredOrders.filter((order) =>
      (order.order_items || []).some((item) => {
        const cat = item.products?.category;
        const sub = item.products?.subcategory;
        const matchCat = !category || cat === category;
        const matchSub = !subcategory || sub === subcategory;
        return matchCat && matchSub;
      }),
    );
  }

  let totalRevenue = 0;
  let totalOrders = filteredOrders.length;
  let totalItems = 0;
  const categoryBreakdown = {};
  const dailySales = {};

  filteredOrders.forEach((order) => {
    let orderRevenue = 0;

    (order.order_items || []).forEach((item) => {
      const cat = item.products?.category || "Other";
      const sub = item.products?.subcategory || "General";
      const lineTotal = Number(item.line_total || item.unit_price * item.quantity);

      if (category && cat !== category) return;
      if (subcategory && sub !== subcategory) return;

      orderRevenue += lineTotal;
      totalItems += item.quantity;

      const key = `${cat} / ${sub}`;
      categoryBreakdown[key] = (categoryBreakdown[key] || 0) + lineTotal;
    });

    totalRevenue += orderRevenue;

    const dayKey = new Date(order.created_at).toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    });
    dailySales[dayKey] = (dailySales[dayKey] || 0) + orderRevenue;
  });

  const chartData = Object.entries(dailySales)
    .map(([label, value]) => ({ label, value }))
    .slice(-14);

  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, revenue]) => ({ name, revenue }));

  return {
    totalRevenue,
    totalOrders,
    totalItems,
    chartData,
    topCategories,
    recentOrders: filteredOrders.slice(0, 8),
  };
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Map sales table row → admin UI shape */
function mapSalesRow(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    orderStatus: row.order_status,
    date: row.sale_date || row.created_at,
    customerName: row.customer_name || "Unknown",
    customerEmail: row.customer_email || "—",
    productName: row.product_name,
    category: row.category || "Other",
    subcategory: row.subcategory || "General",
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  };
}

function buildSalesSummary(rows) {
  const totalRevenue = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const totalItems = rows.reduce((sum, r) => sum + r.quantity, 0);
  const uniqueOrders = new Set(rows.map((r) => r.orderId)).size;

  return {
    totalRevenue,
    totalItems,
    totalOrders: uniqueOrders,
    avgOrderValue: uniqueOrders ? totalRevenue / uniqueOrders : 0,
  };
}

/** Fetch from dedicated `sales` table (preferred) */
async function fetchSalesFromTable({ period, category, subcategory }) {
  const periodStart = getPeriodStart(period);

  let query = supabase
    .from("sales")
    .select("*")
    .gte("sale_date", periodStart)
    .neq("order_status", "cancelled")
    .order("sale_date", { ascending: false });

  if (category) query = query.eq("category", category);
  if (subcategory) query = query.eq("subcategory", subcategory);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []).map(mapSalesRow);
  return { rows, summary: buildSalesSummary(rows) };
}

/** Fallback: derive sales from orders if `sales` table missing */
async function fetchSalesFromOrders({ period, category, subcategory }) {
  const periodStart = getPeriodStart(period);

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      total_amount,
      created_at,
      profiles(full_name, email),
      order_items(
        id,
        product_name,
        quantity,
        unit_price,
        line_total,
        products(category, subcategory)
      )
    `)
    .gte("created_at", periodStart)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = [];

  (orders || []).forEach((order) => {
    (order.order_items || []).forEach((item) => {
      const cat = item.products?.category || "Other";
      const sub = item.products?.subcategory || "General";

      if (category && cat !== category) return;
      if (subcategory && sub !== subcategory) return;

      rows.push({
        id: item.id,
        orderId: order.id,
        orderNumber: order.order_number,
        orderStatus: order.status,
        date: order.created_at,
        customerName: order.profiles?.full_name || "Unknown",
        customerEmail: order.profiles?.email || "—",
        productName: item.product_name,
        category: cat,
        subcategory: sub,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        lineTotal: Number(item.line_total || item.unit_price * item.quantity),
      });
    });
  });

  return { rows, summary: buildSalesSummary(rows) };
}

/** Flattened sales rows for admin Sales table */
export async function fetchSalesRecords({
  period = "monthly",
  category = "",
  subcategory = "",
} = {}) {
  const filters = { period, category, subcategory };

  try {
    return await fetchSalesFromTable(filters);
  } catch (err) {
    const missingTable =
      err?.code === "42P01" ||
      err?.message?.toLowerCase()?.includes("sales");
    if (missingTable) {
      return fetchSalesFromOrders(filters);
    }
    throw err;
  }
}
