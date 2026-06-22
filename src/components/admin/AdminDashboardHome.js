import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLoader from "../PageLoader";
import { withTimeout } from "../../lib/async";
import {
  fetchDashboardStats,
  fetchSalesAnalytics,
  fetchSalesRecords,
} from "../../services/adminService";
import { fetchAdminProducts } from "../../services/productService";
import { getProductProfit } from "../../lib/mappers";
import { formatPKR } from "../../lib/format";
import {
  fetchPromotions,
  getPromotionScheduleStatus,
  getScheduleStatusBadge,
  formatPromotionSchedule,
  promotionTargetLabel,
  syncScheduledPromotions,
} from "../../services/promotionService";
import { fetchCategoriesAdmin } from "../../services/categoryService";

const SUBCATEGORIES = [
  "Watch", "Shoes", "Glasses", "Pants", "Shirt", "Shalwar Kameez",
];

const EMPTY_SALES = {
  totalRevenue: 0,
  totalProfit: 0,
  totalOrders: 0,
  totalItems: 0,
  chartData: [],
  topCategories: [],
  recentOrders: [],
};

export default function AdminDashboardHome() {
  const [promotions, setPromotions] = useState([]);
  const [salesLedger, setSalesLedger] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState(null);
  const [categories, setCategories] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchCategoriesAdmin().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [period, category, subcategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, salesData, promoData, ledgerData, productsData] = await Promise.all([
        withTimeout(fetchDashboardStats(), 8000, null).catch(() => null),
        withTimeout(
          fetchSalesAnalytics({ period, category, subcategory }),
          12000,
          EMPTY_SALES,
        ).catch(() => EMPTY_SALES),
        withTimeout(syncScheduledPromotions().then(() => fetchPromotions()), 8000, []).catch(() => []),
        withTimeout(fetchSalesRecords({ period, category, subcategory }), 12000, { rows: [], summary: {} }).catch(() => ({ rows: [], summary: {} })),
        withTimeout(fetchAdminProducts(), 8000, []).catch(() => []),
      ]);
      setStats(statsData);
      setSales(salesData);
      setPromotions(promoData || []);
      setSalesLedger((ledgerData?.rows || []).slice(0, 8));
      setLedgerSummary(ledgerData?.summary);
      setProducts(productsData || []);
    } catch (e) {
      console.error(e);
      setSales(EMPTY_SALES);
    } finally {
      setLoading(false);
    }
  };

  const maxChart = Math.max(...(sales?.chartData?.map((d) => d.value) || [1]), 1);

  const now = new Date();
  const livePromos = promotions.filter((p) => getPromotionScheduleStatus(p, now) === "live");
  const upcomingPromos = promotions.filter((p) => getPromotionScheduleStatus(p, now) === "upcoming");

  const productMargins = products.map((p) => ({
    id: p._id,
    name: p.name,
    selling: p.salePrice ?? p.price,
    cost: p.costPrice ?? 0,
    profit: getProductProfit(p),
    onSale: p.isSale && p.discountPercent > 0,
  }));
  const avgUnitProfit = productMargins.length
    ? productMargins.reduce((sum, p) => sum + p.profit, 0) / productMargins.length
    : 0;

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPKR(sales?.totalRevenue),
      sub: `${period} filter`,
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Total Profit",
      value: formatPKR(sales?.totalProfit ?? ledgerSummary?.totalProfit),
      sub: "Sold price − cost price",
      color: "from-violet-500 to-purple-600",
    },
    {
      label: "Avg Product Profit",
      value: formatPKR(avgUnitProfit),
      sub: "Selling − cost (per unit)",
      color: "from-violet-600 to-indigo-700",
    },
    {
      label: "Orders",
      value: sales?.totalOrders ?? 0,
      sub: "In selected period",
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Items Sold",
      value: sales?.totalItems ?? 0,
      sub: "Units",
      color: "from-violet-500 to-purple-600",
    },
    {
      label: "Live Sale Offers",
      value: livePromos.length,
      sub: `${upcomingPromos.length} upcoming`,
      color: "from-orange-500 to-red-500",
    },
    {
      label: "Ledger Revenue",
      value: formatPKR(ledgerSummary?.totalRevenue),
      sub: `${ledgerSummary?.totalOrders ?? 0} orders (sales table)`,
      color: "from-cyan-500 to-blue-600",
    },
    {
      label: "Ledger Profit",
      value: formatPKR(ledgerSummary?.totalProfit),
      sub: "Per-product margin",
      color: "from-fuchsia-500 to-pink-600",
    },
    {
      label: "All-Time Revenue",
      value: formatPKR(stats?.total_revenue),
      sub: `${stats?.total_orders ?? 0} total orders`,
      color: "from-amber-500 to-orange-600",
    },
    {
      label: "Products",
      value: stats?.total_products ?? 0,
      sub: `High: ${stats?.stock_high ?? 0} · Low: ${stats?.stock_low ?? 0}`,
      color: "from-slate-600 to-slate-800",
    },
    {
      label: "Users",
      value: stats?.total_users ?? 0,
      sub: "Registered customers",
      color: "from-pink-500 to-rose-600",
    },
  ];

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Velora Admin</h1>
          <p className="text-slate-500 mt-1">Sales dashboard & store overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/products" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">
            + Add Product
          </Link>
          <Link to="/admin/sales-report" className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-semibold">
            Sales Report
          </Link>
          <Link to="/admin/sales" className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-semibold">
            Manage Sale Offers
          </Link>
          <Link to="/admin/orders" className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-semibold">
            View Orders
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Period</label>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {["daily", "weekly", "monthly", "all"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  period === p ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm min-w-[140px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subcategory</label>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm min-w-[160px]"
          >
            <option value="">All Types</option>
            {SUBCATEGORIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader fullScreen={false} />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl bg-gradient-to-br ${card.color} p-5 text-white shadow-lg`}
              >
                <p className="text-sm opacity-90">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
                <p className="text-xs opacity-75 mt-2">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Sales chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Sales Trend</h2>
              {sales?.chartData?.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">No sales in this period</p>
              ) : (
                <div className="flex items-end gap-2 h-48">
                  {sales?.chartData?.map((bar) => (
                    <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-amber-400 rounded-t-lg transition-all min-h-[4px]"
                        style={{ height: `${(bar.value / maxChart) * 100}%` }}
                        title={formatPKR(bar.value)}
                      />
                      <span className="text-[10px] text-slate-400 truncate w-full text-center">{bar.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top categories */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Top Categories / Types</h2>
              <div className="space-y-3">
                {(sales?.topCategories || []).length === 0 ? (
                  <p className="text-slate-400 text-sm">No data yet</p>
                ) : (
                  sales.topCategories.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                      <span className="text-sm font-bold text-emerald-600">{formatPKR(item.revenue)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Stock overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "High Stock", val: stats?.stock_high, cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
              { label: "Medium", val: stats?.stock_medium, cls: "bg-amber-50 text-amber-800 border-amber-200" },
              { label: "Low Stock", val: stats?.stock_low, cls: "bg-orange-50 text-orange-800 border-orange-200" },
              { label: "Out of Stock", val: stats?.stock_out, cls: "bg-red-50 text-red-800 border-red-200" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
                <p className="text-xs font-semibold uppercase">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.val ?? 0}</p>
              </div>
            ))}
          </div>

          {/* Sale Offers on Dashboard */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900">🏷️ Sale Offers</h2>
                <Link to="/admin/sales" className="text-sm text-amber-600 font-semibold">Manage →</Link>
              </div>
              {promotions.length === 0 ? (
                <p className="text-slate-400 text-sm py-6 text-center">No sale offers yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {promotions.slice(0, 6).map((p) => {
                    const st = getPromotionScheduleStatus(p, now);
                    const badge = getScheduleStatusBadge(st);
                    return (
                      <div key={p.id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex justify-between gap-2">
                          <p className="font-semibold text-slate-800">{p.title}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-amber-700 mt-1">{promotionTargetLabel(p)} · {p.discount_percent}% OFF</p>
                        <p className="text-xs text-slate-500 mt-1">{formatPromotionSchedule(p)}</p>
                        {p.ends_at && (
                          <p className="text-xs text-red-600 mt-0.5">
                            Ends: {new Date(p.ends_at).toLocaleString("en-PK")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900">💰 Order Sales Ledger</h2>
                <Link to="/admin/sales-report" className="text-sm text-amber-600 font-semibold">Full report →</Link>
              </div>
              {salesLedger.length === 0 ? (
                <p className="text-slate-400 text-sm py-6 text-center">No sales recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="pb-2 font-semibold">Product</th>
                        <th className="pb-2 font-semibold">Customer</th>
                        <th className="pb-2 font-semibold text-right">Revenue</th>
                        <th className="pb-2 font-semibold text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesLedger.map((r) => (
                        <tr key={r.id} className="border-b border-slate-50">
                          <td className="py-2 line-clamp-1">{r.productName}</td>
                          <td className="py-2 text-slate-500">{r.customerName}</td>
                          <td className="py-2 text-right font-bold text-emerald-700">{formatPKR(r.lineTotal)}</td>
                          <td className="py-2 text-right font-bold text-violet-700">{formatPKR(r.lineProfit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Product profit margins */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Product Profit (per unit)</h2>
              <Link to="/admin/products" className="text-sm text-amber-600 font-semibold">All products →</Link>
            </div>
            {productMargins.length === 0 ? (
              <p className="text-slate-400 text-sm py-6 text-center">No products yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="pb-2 font-semibold">Product</th>
                      <th className="pb-2 font-semibold text-right">Selling</th>
                      <th className="pb-2 font-semibold text-right">Cost</th>
                      <th className="pb-2 font-semibold text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productMargins.slice(0, 8).map((p) => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="py-2 font-medium line-clamp-1">
                          {p.name}
                          {p.onSale && (
                            <span className="ml-1 text-[10px] font-bold text-amber-600 uppercase">Sale</span>
                          )}
                        </td>
                        <td className="py-2 text-right text-emerald-700 font-semibold">{formatPKR(p.selling)}</td>
                        <td className="py-2 text-right text-slate-500">{formatPKR(p.cost)}</td>
                        <td className="py-2 text-right font-bold text-violet-700">{formatPKR(p.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <Link to="/admin/orders" className="text-sm text-amber-600 font-semibold">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-3 font-semibold">Order #</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(sales?.recentOrders || []).map((o) => (
                    <tr key={o.id} className="border-b border-slate-50">
                      <td className="py-3 font-medium">{o.order_number || o.id?.slice(0, 8)}</td>
                      <td className="py-3 text-slate-500">
                        {new Date(o.created_at).toLocaleDateString("en-PK")}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          o.status === "delivered" ? "bg-emerald-100 text-emerald-700"
                          : o.status === "shipped" ? "bg-purple-100 text-purple-700"
                          : o.status === "processing" ? "bg-indigo-100 text-indigo-700"
                          : o.status === "cancelled" ? "bg-red-100 text-red-700"
                          : o.status === "confirmed" ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold">{formatPKR(o.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
