import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageLoader from "../PageLoader";
import { fetchAllOrdersAdmin } from "../../services/orderService";
import { updateOrderStatus } from "../../services/adminService";

function formatPKR(val) {
  return `Rs. ${Number(val || 0).toLocaleString("en-PK")}`;
}

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrdersAdmin();
      setOrders(data);
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      loadOrders();
      Swal.fire("Updated", `Order marked as ${status}`, "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.order_number?.toLowerCase().includes(q) ||
      o.__userDetailCard?.name?.toLowerCase().includes(q) ||
      o.__userDetailCard?.email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (loading) {
    return <PageLoader fullScreen={false} />;
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-3xl font-bold">Orders</h3>
        <p className="text-slate-500">{orders.length} total orders · customer address included</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="Search order #, customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border rounded-xl px-4 py-2.5"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-xl px-4 py-2.5">
          <option value="all">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-center py-12">No orders found</p>
        ) : (
          filtered.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-4 flex flex-wrap justify-between gap-4 border-b">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Order</p>
                  <p className="font-bold text-lg">{order.order_number || order._id?.slice(0, 8)}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(order.createdAt || order.created_at).toLocaleString("en-PK")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Customer</p>
                  <p className="font-semibold">{order.__userDetailCard?.name}</p>
                  <p className="text-sm text-slate-500">{order.__userDetailCard?.email}</p>
                  <p className="text-sm text-slate-500">{order.__userDetailCard?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Total</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatPKR(order.totalAmount)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Status</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-sm font-semibold capitalize"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-sm uppercase text-slate-500 mb-3">Items</h4>
                  <div className="space-y-2">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                        <span>{item.productName} × {item.quantity}</span>
                        <span className="font-semibold">{formatPKR(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-slate-500">
                    Subtotal: {formatPKR(order.subtotal)} · Tax: {formatPKR(order.taxAmount)} · Ship: {formatPKR(order.shippingAmount)}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm uppercase text-slate-500 mb-3">Shipping Address</h4>
                  {order.shippingAddress ? (
                    <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 space-y-1">
                      <p className="font-semibold">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      <p>{order.shippingAddress.address}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      <p className="pt-2 border-t mt-2">
                        📧 {order.shippingAddress.email}<br />
                        📞 {order.shippingAddress.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No address on file</p>
                  )}

                  {order.user && (
                    <div className="mt-4 text-sm">
                      <h4 className="font-bold text-xs uppercase text-slate-500 mb-2">Profile Address</h4>
                      <p className="text-slate-600">
                        {order.user.addressLine}, {order.user.city}, {order.user.state}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
