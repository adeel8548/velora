"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

type MainCategory = "Men" | "Women" | "Kids";
type SubCategory =
  | "Watch"
  | "Shoes"
  | "Glasses"
  | "Pants"
  | "Shirt"
  | "Shalwar Kameez";

interface Product {
  id: number;
  name: string;
  mainCategory: MainCategory;
  subCategory: SubCategory;
  price: number;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

const MAIN_CATEGORIES: MainCategory[] = ["Men", "Women", "Kids"];
const SUB_CATEGORIES: SubCategory[] = [
  "Watch",
  "Shoes",
  "Glasses",
  "Pants",
  "Shirt",
  "Shalwar Kameez",
];

const SUB_CATEGORY_IMAGES: Record<SubCategory, string> = {
  Watch:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop",
  Shoes:
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80&auto=format&fit=crop",
  Glasses:
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80&auto=format&fit=crop",
  Pants:
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80&auto=format&fit=crop",
  Shirt:
    "https://images.unsplash.com/photo-1596755094514-f87e34085b14?w=800&q=80&auto=format&fit=crop",
  "Shalwar Kameez":
    "https://images.unsplash.com/photo-1610030469983-f0e9c8bcaa18?w=800&q=80&auto=format&fit=crop",
};

function generate100Products(): Product[] {
  const products: Product[] = [];

  for (let index = 1; index <= 100; index++) {
    const mainCategory = MAIN_CATEGORIES[(index - 1) % 3];
    const subCategory = SUB_CATEGORIES[(index - 1) % 6];

    products.push({
      id: index,
      name: `Zircon Premium ${subCategory} - Vol. ${index}`,
      mainCategory,
      subCategory,
      price: 1500 + index * 45,
      image: SUB_CATEGORY_IMAGES[subCategory],
    });
  }

  return products;
}

const ALL_PRODUCTS = generate100Products();

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export default function ZirconLuxPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedMainCategories, setSelectedMainCategories] = useState<
    MainCategory[]
  >([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<
    SubCategory[]
  >([]);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      const matchesMain =
        selectedMainCategories.length === 0 ||
        selectedMainCategories.includes(product.mainCategory);
      const matchesSub =
        selectedSubCategories.length === 0 ||
        selectedSubCategories.includes(product.subCategory);
      return matchesMain && matchesSub;
    });
  }, [selectedMainCategories, selectedSubCategories]);

  const toggleMainCategory = useCallback((category: MainCategory) => {
    setSelectedMainCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }, []);

  const toggleSubCategory = useCallback((category: SubCategory) => {
    setSelectedSubCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedMainCategories([]);
    setSelectedSubCategories([]);
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity >= 1),
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const handleCheckout = useCallback(() => {
    setCart([]);
    setIsCartOpen(false);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3500);
  }, []);

  const activeFilterCount =
    selectedMainCategories.length + selectedSubCategories.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 backdrop-blur-md bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Zircon Lux
              </span>
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Premium Fashion Collection
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="group relative rounded-xl border border-slate-700/80 bg-slate-900/60 p-3 transition-all hover:border-emerald-500/50 hover:bg-slate-800/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            aria-label="Open shopping cart"
          >
            <ShoppingBag className="h-5 w-5 text-slate-200 transition-colors group-hover:text-emerald-400" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(16,185,129,0.8)]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile filter toggle */}
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <p className="text-sm text-slate-400">
            {filteredProducts.length} products
          </p>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500/50 hover:text-emerald-400"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <FilterPanel
              selectedMainCategories={selectedMainCategories}
              selectedSubCategories={selectedSubCategories}
              onToggleMain={toggleMainCategory}
              onToggleSub={toggleSubCategory}
              onClear={clearFilters}
              activeFilterCount={activeFilterCount}
            />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="mb-6 hidden items-center justify-between lg:flex">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  All Products
                </h2>
                <p className="text-sm text-slate-400">
                  Showing {filteredProducts.length} of 100 items
                </p>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 py-20 text-center">
                <SlidersHorizontal className="mb-4 h-10 w-10 text-slate-600" />
                <p className="text-lg font-medium text-slate-300">
                  No products match your filters
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm text-emerald-400 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-800">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-400 backdrop-blur-sm">
                          {product.mainCategory}
                        </span>
                        <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-medium text-slate-300 backdrop-blur-sm">
                          {product.subCategory}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-slate-100">
                        {product.name}
                      </h3>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-base font-bold text-emerald-400">
                          {formatPKR(product.price)}
                        </p>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                          aria-label={`Add ${product.name} to cart`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel
              selectedMainCategories={selectedMainCategories}
              selectedSubCategories={selectedSubCategories}
              onToggleMain={toggleMainCategory}
              onToggleSub={toggleSubCategory}
              onClear={clearFilters}
              activeFilterCount={activeFilterCount}
            />
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Show {filteredProducts.length} Products
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isCartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
          aria-label="Close cart"
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 ease-out ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold">Your Cart</h2>
              {cartCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  {cartCount} items
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingBag className="mb-4 h-12 w-12 text-slate-700" />
                <p className="text-slate-400">Your cart is empty</p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 text-sm text-emerald-400 hover:underline"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col">
                      <p className="line-clamp-2 text-sm font-medium text-slate-100">
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-400">
                        {formatPKR(item.price)}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-400"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-400"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-slate-800 px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-xl font-bold text-emerald-400">
                  {formatPKR(subtotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-semibold text-white transition hover:from-emerald-400 hover:to-teal-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.4)]"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      <div
        className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 transition-all duration-500 ${
          showToast
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900 px-6 py-4 shadow-[0_0_40px_rgba(16,185,129,0.25)] backdrop-blur-md">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold text-white">Order Placed Successfully!</p>
            <p className="text-sm text-slate-400">
              Thank you for shopping with Zircon Lux
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterPanelProps {
  selectedMainCategories: MainCategory[];
  selectedSubCategories: SubCategory[];
  onToggleMain: (category: MainCategory) => void;
  onToggleSub: (category: SubCategory) => void;
  onClear: () => void;
  activeFilterCount: number;
}

function FilterPanel({
  selectedMainCategories,
  selectedSubCategories,
  onToggleMain,
  onToggleSub,
  onClear,
  activeFilterCount,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Filters
        </h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-emerald-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-200">Category</h3>
        <div className="space-y-2">
          {MAIN_CATEGORIES.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-800/60"
            >
              <input
                type="checkbox"
                checked={selectedMainCategories.includes(category)}
                onChange={() => onToggleMain(category)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-300">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-200">
          Sub-Category
        </h3>
        <div className="space-y-2">
          {SUB_CATEGORIES.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-800/60"
            >
              <input
                type="checkbox"
                checked={selectedSubCategories.includes(category)}
                onChange={() => onToggleSub(category)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-300">{category}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
