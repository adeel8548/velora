import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, Link } from "react-router-dom";
import { fetchProducts } from "../store/productSlice";
import { addItem } from "../store/cartSlice";
import FilterSidebar from "../components/FilterSidebar";
import LandingPage from "./LandingPage";
import ProductImage from "../components/ProductImage";
import Swal from "sweetalert2";
import { productHasDiscount, buildCartItem } from "../lib/mappers";
import SalePriceHighlight, { SaleRibbon } from "../components/SalePriceHighlight";

function formatPKR(price) {
  return `Rs. ${Number(price || 0).toLocaleString("en-PK")}`;
}

function ProductCard({ product, onAddToCart, addedId }) {
  const onSale = productHasDiscount(product);
  const displayPrice = product.salePrice ?? product.price;

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        onSale
          ? "border-amber-400 ring-2 ring-amber-200/70 shadow-amber-100/50 hover:border-amber-500 hover:shadow-amber-200/40"
          : "border-slate-200/80 hover:border-amber-200 hover:shadow-amber-500/5"
      }`}
    >
      <Link to={`/product/${product._id}`} className="relative block aspect-[4/5] overflow-hidden bg-slate-100">
        {onSale && <SaleRibbon discountPercent={product.discountPercent} />}
        <ProductImage
          src={product.productImage || product.images?.[0]}
          alt={product.name}
          productId={product._id}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
          {onSale && (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
              🏷️ Sale · {product.discountPercent}% OFF
            </span>
          )}
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 backdrop-blur-sm">
          {product.subcategory}
        </span>
      </Link>

      <div className="p-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-600">
          {product.category}
        </p>
        <Link to={`/product/${product._id}`}>
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900 transition hover:text-amber-700">
            {product.name}
          </h3>
        </Link>

        <div className="mb-3 flex items-center gap-1.5">
          <div className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-slate-400">({product.reviews})</span>
        </div>

        {onSale ? (
          <SalePriceHighlight
            salePrice={displayPrice}
            originalPrice={product.originalPrice}
            discountPercent={product.discountPercent}
            size="md"
            variant="card"
            className="mb-4"
          />
        ) : (
          <div className="mb-4">
            <span className="text-lg font-bold text-slate-900">{formatPKR(displayPrice)}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              product.stock <= 0
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : addedId === product._id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {addedId === product._id ? "Added ✓" : "Add to Bag"}
          </button>
          <Link
            to={`/product/${product._id}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-amber-300 hover:text-amber-600"
            aria-label="View details"
          >
            →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ProductList() {
  const location = useLocation();
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.items);
  const status = useSelector((state) => state.products.status);
  const [addedId, setAddedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 20000 });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    const sub = params.get("subcategory");
    const q = params.get("q");
    const sort = params.get("sort");

    if (cat) setSelectedCategory(cat);
    if (sub) setSelectedSubcategory(sub);
    if (q) setSearchTerm(q);
    if (sort === "price-low") setSortBy("price-low");
  }, [location.search]);

  const handleAddToCart = (product) => {
    dispatch(addItem(buildCartItem(product, 1)));
    setAddedId(product._id);
    Swal.fire({
      title: "Added to Bag!",
      text: product.name,
      icon: "success",
      timer: 1200,
      showConfirmButton: false,
    });
    setTimeout(() => setAddedId(null), 2000);
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchesSubcategory =
        !selectedSubcategory || p.subcategory === selectedSubcategory;
      const matchesPrice =
        p.price >= priceRange.min && p.price <= priceRange.max;
      return (
        matchesSearch && matchesCategory && matchesSubcategory && matchesPrice
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const isHomePage = location.pathname === "/";
  if (isHomePage) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* Shop banner */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {selectedCategory ? `${selectedCategory}'s Collection` : "Shop All"}
          </h1>
          <p className="mt-2 text-slate-500">
            {filteredProducts.length} products
            {selectedCategory ? ` in ${selectedCategory}` : ""}
            {selectedSubcategory ? ` · ${selectedSubcategory}` : ""}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Desktop filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <FilterSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={setSelectedSubcategory}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
            />
          </aside>

          <main className="flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-3">
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 lg:hidden"
                >
                  Filters
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Active filter chips */}
            {(selectedCategory || selectedSubcategory) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                  >
                    {selectedCategory} ×
                  </button>
                )}
                {selectedSubcategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory("")}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {selectedSubcategory} ×
                  </button>
                )}
              </div>
            )}

            {status === "loading" && (
              <div className="py-20 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                <p className="mt-4 text-slate-500">Loading collection...</p>
              </div>
            )}

            {filteredProducts.length === 0 && status !== "loading" && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <p className="text-lg font-medium text-slate-700">
                  No products found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try adjusting your filters or search
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onAddToCart={handleAddToCart}
                  addedId={addedId}
                />
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-slate-500"
              >
                ✕
              </button>
            </div>
            <FilterSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={setSelectedSubcategory}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
            />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
            >
              Show {filteredProducts.length} Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
