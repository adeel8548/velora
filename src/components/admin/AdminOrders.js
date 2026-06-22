import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageLoader from "../PageLoader";
import { fetchAllOrdersAdmin } from "../../services/orderService";
import { updateOrderStatus } from "../../services/adminService";
import { calcOrderProfit, calcOrderSavings, orderItemHasSale } from "../../lib/mappers";
import OrderBarcode from "./OrderBarcode";
import { printOrderPackingSlip } from "./OrderPackingSlip";
import Modal from "../Modal";
import OrderPackingSlip from "./OrderPackingSlip";

function formatPKR(val) {
  return `Rs. ${Number(val || 0).toLocaleString("en-PK")}`;
}

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [slipOrder, setSlipOrder] = useState(null);

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
          filtered.map((order) => {
            const orderProfit = calcOrderProfit(order.items || []);
            const orderSavings = calcOrderSavings(order.items || []);
            const orderNo = order.order_number || order._id?.slice(0, 8);

            return (
              <div key={order._id} className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                  <StatusBadge status={order.status} />
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="border rounded-lg px-2 py-1 text-xs font-semibold capitalize bg-white shadow-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>Change → {s}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 px-6 py-4 pr-44 flex flex-wrap gap-4 border-b">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Order</p>
                    <p className="font-bold text-lg">{orderNo}</p>
                    <div className="mt-2 bg-white rounded-lg p-1 inline-block">
                      <OrderBarcode value={order.order_number || order._id} height={36} />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
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
                    <p className="text-sm font-semibold text-violet-600 mt-1">
                      Profit: {formatPKR(orderProfit)}
                    </p>
                    {orderSavings > 0 && (
                      <p className="text-sm font-semibold text-amber-600">
                        Sale savings: {formatPKR(orderSavings)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setSlipOrder(order)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                      >
                        📄 View Slip
                      </button>
                      <button
                        type="button"
                        onClick={() => printOrderPackingSlip(order)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
                      >
                        🖨️ Print for Pack
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-sm uppercase text-slate-500 mb-3">Items</h4>
                    <div className="space-y-3">
                      {(order.items || []).map((item, idx) => {
                        const onSale = orderItemHasSale(item);
                        return (
                        <div key={idx} className="text-sm border-b border-slate-50 pb-3">
                          <div className="flex justify-between font-medium">
                            <span>
                              {item.productName} × {item.quantity}
                              {onSale && (
                                <span className="ml-1 text-[10px] font-bold text-amber-600">
                                  {item.discountPercent}% OFF
                                </span>
                              )}
                            </span>
                            <span className="font-semibold">{formatPKR(item.price * item.quantity)}</span>
                          </div>
                          <div className="mt-1.5 grid grid-cols-4 gap-2 text-xs">
                            <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                              <p className="text-emerald-600">Sale</p>
                              <p className="font-bold text-emerald-800">{formatPKR(item.price)}</p>
                              {onSale && (
                                <p className="text-[10px] text-slate-400 line-through">{formatPKR(item.originalPrice)}</p>
                              )}
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                              <p className="text-slate-400">Cost</p>
                              <p className="font-semibold text-slate-700">{formatPKR(item.unitCost)}</p>
                            </div>
                            <div className="rounded-lg bg-violet-50 px-2 py-1.5">
                              <p className="text-violet-500">Profit</p>
                              <p className="font-bold text-violet-700">{formatPKR(item.lineProfit)}</p>
                            </div>
                            {onSale && (
                              <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                                <p className="text-amber-600">Saved</p>
                                <p className="font-bold text-amber-800">{formatPKR(item.lineSavings)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      Subtotal: {formatPKR(order.subtotal)} · Tax: {formatPKR(order.taxAmount)} · Ship: {formatPKR(order.shippingAmount)}
                    </div>
                    <div className="mt-2 text-sm font-bold text-violet-700">
                      Order Profit: {formatPKR(orderProfit)}
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
            );
          })
        )}
      </div>

      <Modal
        isOpen={Boolean(slipOrder)}
        title="Packing Slip"
        onClose={() => setSlipOrder(null)}
        size="lg"
      >
        {slipOrder && (
          <div>
            <OrderPackingSlip order={slipOrder} />
            <button
              type="button"
              onClick={() => printOrderPackingSlip(slipOrder)}
              className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl font-semibold"
            >
              🖨️ Print — Pack par lagayein
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
