import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLoader from "../PageLoader";
import { withTimeout } from "../../lib/async";
import { fetchSalesRecords } from "../../services/adminService";

function formatPKR(n) {
  return `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;
}

export default function AdminSalesReport() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    withTimeout(fetchSalesRecords({ period }), 12000, { rows: [], summary: {} })
      .then((data) => {
        setRows(data.rows || []);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Report</h1>
          <p className="mt-1 text-slate-500">Order sales ledger from Supabase `sales` table</p>
        </div>
        <Link
          to="/admin"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {["daily", "weekly", "monthly", "all"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
              period === p ? "bg-slate-900 text-white" : "border border-slate-200 bg-white"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Revenue", val: formatPKR(summary.totalRevenue) },
            { label: "Orders", val: summary.totalOrders },
            { label: "Items Sold", val: summary.totalItems },
            { label: "Avg Order", val: formatPKR(summary.avgOrderValue) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">{s.label}</p>
              <p className="text-xl font-bold">{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <PageLoader fullScreen={false} />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No sales in this period
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(r.date).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.orderNumber}</td>
                    <td className="px-4 py-3">{r.customerName}</td>
                    <td className="px-4 py-3">{r.productName}</td>
                    <td className="px-4 py-3">{r.category}</td>
                    <td className="px-4 py-3 text-center">{r.quantity}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {formatPKR(r.lineTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
