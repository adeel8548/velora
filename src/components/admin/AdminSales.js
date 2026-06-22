import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageLoader from "../PageLoader";
import {
  fetchPromotions,
  createPromotion,
  togglePromotion,
  deletePromotion,
  promotionTargetLabel,
  combineDateAndTime,
  getPromotionScheduleStatus,
  getScheduleStatusBadge,
  formatPromotionSchedule,
  formatUpcomingLabel,
  syncScheduledPromotions,
} from "../../services/promotionService";
import { fetchAdminProducts } from "../../services/productService";
import { fetchCategoriesAdmin } from "../../services/categoryService";
function formatPKR(n) {
  return `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;
}

const SUBCATEGORIES = [
  "Watch",
  "Shoes",
  "Glasses",
  "Pants",
  "Shirt",
  "Shalwar Kameez",
];

const EMPTY_FORM = {
  title: "",
  applyTo: "category",
  productId: "",
  category: "Men",
  subcategory: "Watch",
  discountPercent: "20",
  notes: "",
  scheduleMode: "scheduled",
  startDate: "",
  startTime: "00:00",
  endDate: "",
  endTime: "",
};

export default function AdminSales() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      await syncScheduledPromotions();
      const [promoData, productData, catData] = await Promise.all([
        fetchPromotions(),
        fetchAdminProducts(),
        fetchCategoriesAdmin(),
      ]);
      setPromotions(promoData);
      setProducts(productData);
      setCategories(catData);
    } catch (e) {
      if (!silent) {
        Swal.fire("Error", e.message || "Could not load promotions", "error");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 60000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const upcomingPromos = promotions.filter(
    (p) => getPromotionScheduleStatus(p, now) === "upcoming",
  );
  const livePromos = promotions.filter(
    (p) => getPromotionScheduleStatus(p, now) === "live",
  );

  const onSaleProducts = products.filter((p) => p.isSale && p.discountPercent > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      Swal.fire("Required", "Sale title enter karein", "warning");
      return;
    }

    const discount = Number(form.discountPercent);
    if (!discount || discount < 1 || discount > 100) {
      Swal.fire("Invalid", "Discount 1–100% hona chahiye", "warning");
      return;
    }

    if (form.applyTo === "product" && !form.productId) {
      Swal.fire("Required", "Product select karein", "warning");
      return;
    }

    if (form.scheduleMode === "scheduled" && !form.startDate) {
      Swal.fire("Required", "Sale start date select karein (e.g. 14 August)", "warning");
      return;
    }

    if (form.scheduleMode === "scheduled" && !form.endDate) {
      Swal.fire("Required", "Sale end date select karein — is date par sale band ho jayegi", "warning");
      return;
    }

    const startsAt = form.scheduleMode === "now"
      ? null
      : combineDateAndTime(form.startDate, form.startTime);

    const endsAt = form.endDate
      ? combineDateAndTime(form.endDate, form.endTime || "23:59")
      : null;

    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      Swal.fire("Invalid", "End date/time start se baad honi chahiye", "warning");
      return;
    }

    setSaving(true);
    try {
      const selectedProduct = products.find((p) => p._id === form.productId);

      await createPromotion({
        title: form.title,
        applyTo: form.applyTo,
        productId: form.productId,
        productName: selectedProduct?.name,
        category: form.category,
        subcategory: form.subcategory,
        discountPercent: discount,
        notes: form.notes,
        startsAt,
        endsAt,
        startImmediately: form.scheduleMode === "now",
      });

      Swal.fire(
        "Done!",
        form.scheduleMode === "scheduled"
          ? `Sale schedule ho gayi — ${form.startDate} ${form.startTime} par start hogi`
          : "Sale apply ho gayi",
        "success",
      );
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      Swal.fire("Error", err.message || "Could not apply sale", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo) => {
    try {
      await togglePromotion(promo.id, !promo.is_active, promo);
      load();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleDelete = async (promo) => {
    const res = await Swal.fire({
      title: "Sale hata dein?",
      text: promotionTargetLabel(promo),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
    });
    if (!res.isConfirmed) return;

    try {
      await deletePromotion(promo);
      Swal.fire("Removed", "Sale hata di gayi", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  if (loading) {
    return <PageLoader fullScreen={false} />;
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sale Offers</h1>
          <p className="mt-1 text-slate-500">
            Product ya brand (Men/Women/Kids) par discount lagayein — yahan dikhega kahan sale lagi hai
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25"
        >
          {showForm ? "Cancel" : "+ Add Sale"}
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase text-blue-700">Upcoming</p>
          <p className="mt-1 text-3xl font-bold text-blue-900">{upcomingPromos.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase text-emerald-700">Live Now</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">{livePromos.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase text-amber-700">Products on Sale</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{onSaleProducts.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Offers</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{promotions.length}</p>
        </div>
      </div>

      {/* Upcoming sales highlight */}
      {upcomingPromos.length > 0 && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
          <h2 className="mb-3 text-lg font-bold text-blue-900">📅 Upcoming Sales</h2>
          <div className="space-y-2">
            {upcomingPromos.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/80 px-4 py-3"
              >
                <p className="font-semibold text-slate-800">{formatUpcomingLabel(p)}</p>
                <span className="text-sm font-bold text-blue-600">{p.title}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-blue-600">
            Set time par sale auto-start hogi (har minute sync hoti hai jab koi site open ho)
          </p>
        </div>
      )}

      {/* Add sale form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Nayi Sale Lagayein</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Sale Title *
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Men Summer Sale 20%"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Apply On *
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  value={form.applyTo}
                  onChange={(e) => setForm({ ...form, applyTo: e.target.value })}
                >
                  <option value="product">Single Product</option>
                  <option value="category">Brand / Category (Men, Women, Kids)</option>
                  <option value="subcategory">Category + Type (e.g. Men → Shoes)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Discount % *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  required
                />
              </div>

              {form.applyTo === "product" && (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Product *
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    required
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.applyTo !== "product" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Brand / Category *
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {(categories.length
                      ? categories
                      : [{ name: "Men" }, { name: "Women" }, { name: "Kids" }]
                    ).map((c) => (
                      <option key={c.name || c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.applyTo === "subcategory" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Type / Subcategory *
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  >
                    {SUBCATEGORIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-4">
                <p className="text-sm font-bold text-slate-800">⏰ Schedule</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={form.scheduleMode === "now"}
                      onChange={() => setForm({ ...form, scheduleMode: "now" })}
                    />
                    Start immediately
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={form.scheduleMode === "scheduled"}
                      onChange={() => setForm({ ...form, scheduleMode: "scheduled" })}
                    />
                    Schedule for later (e.g. 14 August)
                  </label>
                </div>

                {form.scheduleMode === "scheduled" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        required={form.scheduleMode === "scheduled"}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      />
                      <p className="mt-1 text-[10px] text-slate-400">12:00 AM = raat 12 baje</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        End Date *
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        required={form.scheduleMode === "scheduled"}
                      />
                      <p className="mt-1 text-[10px] text-slate-400">Is date par sale automatically band ho jayegi</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                        End Time *
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Notes (optional)
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Internal note..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Applying..." : "Apply Sale"}
            </button>
          </form>
        </div>
      )}

      {/* Promotions table — kahan sale lagi hai */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Applied Sales</h2>
          <p className="text-sm text-slate-500">Kis product ya brand par sale lagi hai</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Applied On</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Schedule</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Abhi koi sale nahi lagi — &quot;Add Sale&quot; se shuru karein
                  </td>
                </tr>
              ) : (
                promotions.map((p) => {
                  const scheduleStatus = getPromotionScheduleStatus(p, now);
                  const badge = getScheduleStatusBadge(scheduleStatus);
                  return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                        {promotionTargetLabel(p)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {p.discount_percent}% OFF
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {formatPromotionSchedule(p)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(p)}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200"
                        >
                          {p.is_active ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products currently on sale */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Products on Sale Now</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Brand</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold text-right">Original</th>
                <th className="px-4 py-3 font-semibold text-right">Sale Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {onSaleProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Koi product sale par nahi hai
                  </td>
                </tr>
              ) : (
                onSaleProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.category}</td>
                      <td className="px-4 py-3">{p.subcategory}</td>
                      <td className="px-4 py-3 font-bold text-amber-600">
                        {p.discountPercent}% OFF
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 line-through">
                        {formatPKR(p.originalPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {formatPKR(p.salePrice ?? p.price)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
