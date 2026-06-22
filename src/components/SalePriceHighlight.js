import React from "react";
import { formatPKR } from "../lib/format";

const SIZES = {
  sm: {
    price: "text-sm",
    was: "text-[10px]",
    save: "text-[10px]",
  },
  md: {
    price: "text-lg",
    was: "text-xs",
    save: "text-xs",
  },
  lg: {
    price: "text-3xl sm:text-4xl",
    was: "text-base",
    save: "text-sm",
  },
};

/**
 * Sale pricing display.
 * variant="card" — simple price + strikethrough + "You save" (no box/badges)
 * variant="full" — highlighted box (cart/checkout)
 */
export default function SalePriceHighlight({
  salePrice,
  originalPrice,
  discountPercent = 0,
  size = "md",
  variant = "card",
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

  const prices = (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-bold text-emerald-700 ${s.price}`}>
        {formatPKR(sale)}
      </span>
      <span className={`text-slate-400 line-through ${s.was}`}>
        {formatPKR(original)}
      </span>
    </div>
  );

  const savings = (
    <p className={`font-semibold text-amber-700 ${s.save}`}>
      You save {formatPKR(saved)}
    </p>
  );

  if (variant === "card") {
    return (
      <div className={className}>
        {prices}
        {savings}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50/80 p-3 ${className}`}
    >
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
