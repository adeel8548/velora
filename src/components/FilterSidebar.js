import React from "react";
import { DEMO_CATEGORIES, DEMO_SUBCATEGORIES, PRODUCTS_PER_CATEGORY } from "../data/demoProducts";

export default function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
  priceRange,
  onPriceChange,
}) {
  return (
    <div className="sticky top-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-slate-900">Filters</h2>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Category
        </h3>
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50">
            <input
              type="radio"
              name="category"
              checked={selectedCategory === ""}
              onChange={() => {
                onCategoryChange("");
                onSubcategoryChange("");
              }}
              className="h-4 w-4 accent-amber-600"
            />
            <span className="text-sm font-medium text-slate-700">
              All Categories
            </span>
          </label>
          {DEMO_CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat}
                onChange={() => {
                  onCategoryChange(cat);
                  onSubcategoryChange("");
                }}
                className="h-4 w-4 accent-amber-600"
              />
              <span className="text-sm font-medium text-slate-700">
                {cat}
                <span className="ml-1.5 text-xs text-slate-400">
                  ({PRODUCTS_PER_CATEGORY})
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      {selectedCategory && (
        <div className="mb-6 border-t border-slate-100 pt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Type
          </h3>
          <div className="space-y-1">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50">
              <input
                type="radio"
                name="subcategory"
                checked={selectedSubcategory === ""}
                onChange={() => onSubcategoryChange("")}
                className="h-4 w-4 accent-amber-600"
              />
              <span className="text-sm font-medium text-slate-700">All Types</span>
            </label>
            {DEMO_SUBCATEGORIES.map((sub) => (
              <label
                key={sub}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="subcategory"
                  checked={selectedSubcategory === sub}
                  onChange={() => onSubcategoryChange(sub)}
                  className="h-4 w-4 accent-amber-600"
                />
                <span className="text-sm font-medium text-slate-700">{sub}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="mb-6 border-t border-slate-100 pt-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Price (PKR)
        </h3>
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Min</span>
              <span className="font-semibold text-slate-700">
                Rs. {priceRange.min.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20000"
              step="500"
              value={priceRange.min}
              onChange={(e) =>
                onPriceChange({
                  ...priceRange,
                  min: parseInt(e.target.value, 10),
                })
              }
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-amber-600"
            />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Max</span>
              <span className="font-semibold text-slate-700">
                Rs. {priceRange.max.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20000"
              step="500"
              value={priceRange.max}
              onChange={(e) =>
                onPriceChange({
                  ...priceRange,
                  max: parseInt(e.target.value, 10),
                })
              }
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-amber-600"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          onCategoryChange("");
          onSubcategoryChange("");
          onPriceChange({ min: 0, max: 20000 });
        }}
        className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
      >
        Clear All Filters
      </button>
    </div>
  );
}
