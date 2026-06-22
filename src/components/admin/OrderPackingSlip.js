import React from "react";
import OrderBarcode from "./OrderBarcode";
import { calcOrderSavings, orderItemHasSale } from "../../lib/mappers";
import { formatPKR } from "../../lib/format";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Printable packing slip — attach on parcel for delivery.
 */
export default function OrderPackingSlip({ order }) {
  if (!order) return null;

  const orderNo = order.order_number || order._id?.slice(0, 8);
  const savings = calcOrderSavings(order.items || []);
  const addr = order.shippingAddress || {};

  return (
    <div className="order-packing-slip bg-white text-slate-900 p-6 max-w-lg mx-auto text-sm">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .order-packing-slip, .order-packing-slip * { visibility: visible; }
          .order-packing-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            padding: 16px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="border-2 border-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Velora</p>
            <h1 className="text-lg font-bold">Packing Slip</h1>
            <p className="text-xs text-slate-500 mt-1">{formatDate(order.createdAt || order.created_at)}</p>
          </div>
          <OrderBarcode value={orderNo} height={40} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Ship To</p>
            <p className="font-bold">
              {addr.firstName} {addr.lastName}
            </p>
            <p>{addr.address}</p>
            <p>
              {addr.city}, {addr.state} {addr.zipCode}
            </p>
            <p>{addr.country || "Pakistan"}</p>
            <p className="mt-2 font-semibold">📞 {addr.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Order</p>
            <p className="font-mono font-bold text-base">{orderNo}</p>
            <p className="mt-2 capitalize">
              Status: <span className="font-semibold">{order.status}</span>
            </p>
            <p className="mt-1">Items: {(order.items || []).length}</p>
          </div>
        </div>

        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 font-semibold">Product</th>
              <th className="pb-2 font-semibold text-center">Qty</th>
              <th className="pb-2 font-semibold text-right">Sale Price</th>
              <th className="pb-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, idx) => {
              const onSale = orderItemHasSale(item);
              return (
                <tr key={idx} className="border-b border-slate-50">
                  <td className="py-2 pr-2">
                    <span className="font-medium">{item.productName}</span>
                    {onSale && (
                      <span className="block text-[10px] text-amber-600 font-bold">
                        {item.discountPercent}% OFF
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">
                    <span className="font-semibold text-emerald-700">{formatPKR(item.price)}</span>
                    {onSale && (
                      <span className="block text-[10px] text-slate-400 line-through">
                        {formatPKR(item.originalPrice)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right font-bold">{formatPKR(item.price * item.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPKR(order.subtotal)}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between text-amber-700 font-semibold">
              <span>Customer Savings (Sale)</span>
              <span>− {formatPKR(savings)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPKR(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatPKR(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
            <span>Total Paid</span>
            <span>{formatPKR(order.totalAmount)}</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-4 pt-3 border-t border-dashed border-slate-200">
          Attach this slip on package · Scan barcode to verify order
        </p>
      </div>
    </div>
  );
}

export function printOrderPackingSlip(order) {
  const orderNo = order.order_number || order._id?.slice(0, 8);
  const savings = calcOrderSavings(order.items || []);
  const addr = order.shippingAddress || {};
  const itemsHtml = (order.items || [])
    .map((item) => {
      const onSale = orderItemHasSale(item);
      return `
        <tr>
          <td>${item.productName}${onSale ? `<br><small style="color:#d97706">${item.discountPercent}% OFF</small>` : ""}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">
            <strong style="color:#047857">Rs. ${Number(item.price).toLocaleString("en-PK")}</strong>
            ${onSale ? `<br><small style="text-decoration:line-through;color:#94a3b8">Rs. ${Number(item.originalPrice).toLocaleString("en-PK")}</small>` : ""}
          </td>
          <td style="text-align:right"><strong>Rs. ${(item.price * item.quantity).toLocaleString("en-PK")}</strong></td>
        </tr>`;
    })
    .join("");

  const win = window.open("", "_blank", "width=480,height=720");
  if (!win) return;

  win.document.write(`<!DOCTYPE html><html><head>
    <title>Packing Slip ${orderNo}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 16px; color: #0f172a; font-size: 12px; }
      h1 { margin: 0 0 4px; font-size: 18px; }
      .brand { color: #d97706; font-weight: 700; font-size: 10px; letter-spacing: 0.1em; }
      .box { border: 2px solid #0f172a; border-radius: 8px; padding: 16px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      th, td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; text-align: left; }
      th { color: #64748b; font-size: 10px; text-transform: uppercase; }
      .barcode { font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 2px; border: 1px solid #cbd5e1; padding: 8px; display: inline-block; }
      .totals div { display: flex; justify-content: space-between; padding: 2px 0; }
      .total-row { font-size: 14px; font-weight: bold; border-top: 1px solid #0f172a; margin-top: 6px; padding-top: 6px; }
      .footer { text-align: center; color: #94a3b8; font-size: 10px; margin-top: 12px; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
      @media print { body { padding: 0; } }
    </style>
  </head><body onload="window.print(); window.close();">
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:12px">
        <div>
          <div class="brand">VELORA</div>
          <h1>Packing Slip</h1>
          <small>${formatDate(order.createdAt || order.created_at)}</small>
        </div>
        <div class="barcode">${orderNo}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
        <div>
          <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">Ship To</div>
          <strong>${addr.firstName || ""} ${addr.lastName || ""}</strong><br>
          ${addr.address || ""}<br>
          ${addr.city || ""}, ${addr.state || ""} ${addr.zipCode || ""}<br>
          ${addr.country || "Pakistan"}<br>
          <strong>📞 ${addr.phone || ""}</strong>
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">Order</div>
          <strong style="font-size:14px">${orderNo}</strong><br>
          Status: <strong>${order.status}</strong>
        </div>
      </div>
      <table>
        <thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Sale</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>Rs. ${Number(order.subtotal || 0).toLocaleString("en-PK")}</span></div>
        ${savings > 0 ? `<div style="color:#d97706;font-weight:600"><span>Sale Savings</span><span>− Rs. ${savings.toLocaleString("en-PK")}</span></div>` : ""}
        <div><span>Tax</span><span>Rs. ${Number(order.taxAmount || 0).toLocaleString("en-PK")}</span></div>
        <div><span>Shipping</span><span>Rs. ${Number(order.shippingAmount || 0).toLocaleString("en-PK")}</span></div>
        <div class="total-row"><span>Total Paid</span><span>Rs. ${Number(order.totalAmount || 0).toLocaleString("en-PK")}</span></div>
      </div>
      <div class="footer">Attach on package · Order barcode: ${orderNo}</div>
    </div>
  </body></html>`);
  win.document.close();
}
