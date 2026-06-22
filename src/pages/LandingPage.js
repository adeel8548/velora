import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../store/productSlice";
import { addItem } from "../store/cartSlice";

import ProductImage from "../components/ProductImage";
import { productHasDiscount, buildCartItem } from "../lib/mappers";
import SalePriceHighlight, { SaleRibbon } from "../components/SalePriceHighlight";

const CATEGORY_CARDS = [
  {
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80",
    tagline: "Sharp & Sophisticated",
    count: "25 products",
  },
  {
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80",
    tagline: "Elegance Redefined",
    count: "25 products",
  },
  {
    name: "Kids",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=1000&fit=crop&q=80",
    tagline: "Playful & Comfortable",
    count: "25 products",
  },
];

function formatPKR(price) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

export default function LandingPage() {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.items);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleAddToCart = (product) => {
    dispatch(addItem(buildCartItem(product, 1)));
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const featuredProducts = products.filter((p) => p.isNew || p.isSale).slice(0, 8);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80&auto=format&fit=crop"
            alt="Fashion hero"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col items-start px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <span className="mb-4 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-400">
            Spring Collection 2026
          </span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Style That Speaks
            <span className="block text-amber-400">Before You Do</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-300">
            Discover 75 curated pieces — 25 each for Men, Women & Kids. Watches,
            shoes, shirts, shalwar kameez and more. Premium quality, delivered
            across Pakistan.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/shop"
              className="rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/30"
            >
              Shop Collection
            </Link>
            <Link
              to="/shop?category=Women"
              className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
            >
              Women&apos;s New Arrivals
            </Link>
          </div>
          <div className="mt-14 flex gap-10 border-t border-white/10 pt-8">
            {[
              { value: "75", label: "Products" },
              { value: "25", label: "Per Category" },
              { value: "Free", label: "Shipping 5K+" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { icon: "🚚", title: "Free Delivery", desc: "Orders over Rs. 5,000" },
            { icon: "↩️", title: "Easy Returns", desc: "30-day policy" },
            { icon: "🔒", title: "Secure Pay", desc: "100% protected" },
            { icon: "✨", title: "Premium Quality", desc: "Handpicked items" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Shop by Category
            </h2>
            <p className="mt-3 text-slate-500">
              Men, Women & Kids — watches, shoes, glasses, pants, shirts & more
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {CATEGORY_CARDS.map((cat) => (
              <Link
                key={cat.name}
                to={`/shop?category=${cat.name}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl sm:aspect-[4/5]"
              >
                <ProductImage
                  src={cat.image}
                  alt={cat.name}
                  productId={`cat-${cat.name}`}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                    {cat.count}
                  </p>
                  <h3 className="mt-1 text-3xl font-bold">{cat.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{cat.tagline}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-400 opacity-0 transition group-hover:opacity-100">
                    Shop Now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-category pills */}
      <section className="border-y border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
            Browse by Type
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {["Watch", "Shoes", "Glasses", "Pants", "Shirt", "Shalwar Kameez"].map(
              (sub) => (
                <Link
                  key={sub}
                  to={`/shop?subcategory=${encodeURIComponent(sub)}`}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                >
                  {sub}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Trending Now
              </h2>
              <p className="mt-2 text-slate-500">Our most loved pieces this week</p>
            </div>
            <Link
              to="/shop"
              className="hidden text-sm font-semibold text-amber-600 hover:text-amber-700 sm:block"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {displayProducts.map((product) => (
              <div
                key={product._id}
                className={`group overflow-hidden rounded-2xl border bg-white transition hover:shadow-lg ${
                  productHasDiscount(product)
                    ? "border-amber-400 ring-2 ring-amber-100"
                    : "border-slate-200"
                }`}
              >
                <Link
                  to={`/product/${product._id}`}
                  className="relative block aspect-square overflow-hidden bg-slate-100"
                >
                  {productHasDiscount(product) && (
                    <SaleRibbon discountPercent={product.discountPercent} />
                  )}
                  <ProductImage
                    src={product.productImage || product.images?.[0]}
                    alt={product.name}
                    productId={product._id}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </Link>
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                    {product.category} · {product.subcategory}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">
                    {product.name}
                  </h3>
                  {productHasDiscount(product) ? (
                    <SalePriceHighlight
                      salePrice={product.salePrice ?? product.price}
                      originalPrice={product.originalPrice}
                      discountPercent={product.discountPercent}
                      size="sm"
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-base font-bold text-slate-900">
                      {formatPKR(product.price)}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className={`mt-3 w-full rounded-xl py-2 text-xs font-semibold transition ${
                      addedId === product._id
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {addedId === product._id ? "Added ✓" : "Add to Bag"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link
              to="/shop"
              className="inline-block rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-4 mb-20 overflow-hidden rounded-3xl bg-slate-900 sm:mx-6 lg:mx-auto lg:max-w-7xl">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center p-10 lg:p-16">
            <h2 className="text-3xl font-bold text-white lg:text-4xl">
              Get 15% Off Your First Order
            </h2>
            <p className="mt-4 text-slate-400">
              Join Velora and enjoy exclusive deals on premium fashion for the
              whole family.
            </p>
            <div className="mt-8 flex gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-400"
              >
                Subscribe
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80&auto=format&fit=crop"
              alt="Fashion"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
