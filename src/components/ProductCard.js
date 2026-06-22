import React from "react";
import { Link } from "react-router-dom";
import { formatPKR } from "../lib/format";
import { productHasDiscount } from "../lib/mappers";
import SalePriceHighlight, { SaleRibbon } from "./SalePriceHighlight";

export default function ProductCard({ product, onAdd }) {
  const onSale = productHasDiscount(product);
  const displayPrice = product.salePrice ?? product.price;

  return (
    <div className="bg-white soft-rounded overflow-hidden card-shadow hover:shadow-2xl transition transform hover:-translate-y-2">
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {onSale && <SaleRibbon discountPercent={product.discountPercent} />}
        {product?.productImage || product?.images?.[0] ? (
          <img
            src={product.productImage || product.images?.[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            📦
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex text-yellow-400 text-sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i}>⭐</span>
            ))}
          </div>
          <div className="text-sm text-gray-500">(120)</div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {onSale ? (
            <SalePriceHighlight
              salePrice={displayPrice}
              originalPrice={product.originalPrice}
              discountPercent={product.discountPercent}
              size="sm"
            />
          ) : (
            <div className={`text-xl font-bold text-slate-900`}>
              {formatPKR(displayPrice)}
            </div>
          )}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => onAdd && onAdd(product)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full text-sm font-semibold hover:scale-105 transition transform"
            >
              Add
            </button>
            <Link
              to={`/product/${product._id}`}
              className="text-xs text-indigo-600 hover:underline"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
