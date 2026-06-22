import React from "react";
import { formatPKR } from "../lib/format";

const SIZES = {
  sm: {
    box: "p-2 rounded-lg",
    sale: "text-[9px] px-1.5 py-0.5",
    off: "text-[9px] px-1.5 py-0.5",
    price: "text-sm",
    was: "text-[10px]",
    save: "text-[9px]",
  },
  md: {
    box: "p-3 rounded-xl",
    sale: "text-[10px] px-2 py-0.5",
    off: "text-[10px] px-2 py-0.5",
    price: "text-lg",
    was: "text-xs",
    save: "text-[10px]",
  },
  lg: {
    box: "p-4 rounded-2xl",
    sale: "text-xs px-3 py-1",
    off: "text-xs px-3 py-1",
    price: "text-3xl sm:text-4xl",
    was: "text-base",
    save: "text-xs",
  },
};

/**
 * Brand-style sale block: SALE badge + discount % + sale price + was price + savings.
 */
export default function SalePriceHighlight({
  salePrice,
  originalPrice,
  discountPercent = 0,
  size = "md",
  layout = "block",
  className = "",
}) {
  const sale = Number(salePrice ?? 0);
  const original = Number(originalPrice ?? sale);
  const discount = Number(discountPercent ?? 0);
  const onSale = discount > 0 && original > sale;
  const saved = original - sale;
  const s = SIZES[size] || SIZES.md;

  if (!onSale) {
    return (
      <span className={`font-bold text-slate-900 ${s.price} ${className}`}>
        {formatPKR(sale)}
      </span>
    );
  }

  const badges = (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-red-600 font-black uppercase tracking-wider text-white shadow-sm ${s.sale}`}
      >
        <span aria-hidden>🏷️</span> Sale
      </span>
      <span
        className={`inline-flex rounded-md bg-amber-500 font-black uppercase tracking-wide text-white shadow-sm ${s.off}`}
      >
        {discount}% Off
      </span>
    </div>
  );

  const prices = (
    <div className={`flex flex-wrap items-baseline gap-2 ${layout === "inline" ? "mt-0" : "mt-2"}`}>
      <span className={`font-black text-emerald-700 ${s.price}`}>
        {formatPKR(sale)}
      </span>
      <span className={`text-slate-400 line-through font-medium ${s.was}`}>
        {formatPKR(original)}
      </span>
    </div>
  );

  const savings = (
    <p className={`mt-1 font-bold text-amber-700 ${s.save}`}>
      You save {formatPKR(saved)}
    </p>
  );

  if (layout === "inline") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        {badges}
        {prices}
        {savings}
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-amber-400/80 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 shadow-sm ring-1 ring-amber-200/60 ${s.box} ${className}`}
    >
      {badges}
      {prices}
      {savings}
    </div>
  );
}

export function SaleRibbon({ discountPercent, className = "" }) {
  const discount = Number(discountPercent ?? 0);
  if (discount <= 0) return null;

  return (
    <div className={`absolute right-0 top-3 z-10 ${className}`}>
      <div className="relative">
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 shadow-lg rounded-l-lg">
          Sale
        </div>
        <div className="absolute -bottom-1 right-0 w-0 h-0 border-t-[6px] border-t-red-800 border-l-[6px] border-l-transparent" />
      </div>
      <span className="mt-1 block text-center text-[10px] font-black text-red-600 bg-white/95 rounded px-1.5 py-0.5 shadow">
        −{discount}%
      </span>
    </div>
  );
}
