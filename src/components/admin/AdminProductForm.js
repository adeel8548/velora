import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  fetchCategories,
  fetchSubcategories,
  fetchProductById,
} from "../../services/productService";

const SUBCATEGORY_NAMES = [
  "Watch", "Shoes", "Glasses", "Pants", "Shirt", "Shalwar Kameez",
];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  cost_price: "",
  stock: "",
  category: "",
  subcategory: "",
  product_image: "",
  is_sale: false,
  discount_percent: "",
};

export default function AdminProductForm({
  onSuccess,
  initialData = null,
  productId = null,
  onCancel,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [productImageFile, setProductImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const populateForm = useCallback((p) => {
    if (!p) return;
    const discount = Number(p.discountPercent ?? p.discount_percent ?? 0);
    const onSale = discount > 0 || Boolean(p.isSale ?? p.is_sale);

    setForm({
      name: p.name || "",
      description: p.description || "",
      price: String(p.originalPrice ?? p.price ?? ""),
      cost_price: String(p.costPrice ?? p.cost_price ?? ""),
      stock: String(p.stock ?? ""),
      category: p.category || "",
      subcategory: p.subcategory || "",
      product_image: p.productImage || p.product_image || "",
      is_sale: onSale,
      discount_percent: discount > 0 ? String(discount) : "",
    });
    setExistingImage(p.productImage || p.product_image || null);
    setProductImageFile(null);
  }, []);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (productId) {
      setFormLoading(true);
      fetchProductById(productId)
        .then(populateForm)
        .catch(() => {
          if (initialData) populateForm(initialData);
        })
        .finally(() => setFormLoading(false));
      return;
    }

    if (initialData) {
      populateForm(initialData);
    } else {
      setForm(EMPTY_FORM);
      setExistingImage(null);
      setProductImageFile(null);
    }
  }, [productId, initialData, populateForm]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let imageUrl = form.product_image || existingImage;

      if (productImageFile) {
        imageUrl = await uploadProductImage(productImageFile);
      }

      const discount = parseInt(form.discount_percent, 10) || 0;

      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        cost_price: parseFloat(form.cost_price) || 0,
        stock: parseInt(form.stock, 10) || 0,
        category: form.category,
        subcategory: form.subcategory,
        product_image: imageUrl,
        images: imageUrl ? [imageUrl] : [],
        is_active: true,
        is_sale: form.is_sale && discount > 0,
        discount_percent: form.is_sale && discount > 0 ? discount : 0,
      };

      const cat = categories.find((c) => c.name === form.category);
      if (cat) {
        payload.category_id = cat.id;
        const subs = await fetchSubcategories(form.category);
        const sub = subs.find((s) => s.name === form.subcategory);
        if (sub) payload.subcategory_id = sub.id;
      }

      if (productId) {
        await updateProduct(productId, payload);
        Swal.fire("Updated", "Product updated in Supabase", "success");
      } else {
        await createProduct(payload);
        Swal.fire("Created", "Product added to Supabase", "success");
      }

      onSuccess?.();
    } catch (err) {
      setError(err.message || "Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const listPrice = parseFloat(form.price) || 0;
  const discountPct = parseInt(form.discount_percent, 10) || 0;
  const previewSalePrice =
    form.is_sale && discountPct > 0
      ? Math.round(listPrice * (1 - discountPct / 100))
      : listPrice;
  const previewProfit = previewSalePrice - (parseFloat(form.cost_price) || 0);

  if (formLoading) {
    return <p className="text-slate-500 text-sm py-8 text-center">Loading product...</p>;
  }

  return (
    <div className="p-2">
      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <input
          type="text"
          name="name"
          className="w-full border rounded-xl px-4 py-2.5"
          placeholder="Product Name *"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          className="w-full border rounded-xl px-4 py-2.5"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={handleChange}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Selling Price (List) PKR *</label>
            <input type="number" name="price" className="w-full border rounded-xl px-4 py-2.5" placeholder="e.g. 5000" value={form.price} onChange={handleChange} required min="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cost / Purchase PKR</label>
            <input type="number" name="cost_price" className="w-full border rounded-xl px-4 py-2.5" placeholder="e.g. 3500" value={form.cost_price} onChange={handleChange} min="0" />
          </div>
        </div>
        <input type="number" name="stock" className="w-full border rounded-xl px-4 py-2.5" placeholder="Stock qty *" value={form.stock} onChange={handleChange} required min="0" />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={form.is_sale}
              onChange={(e) => setForm({ ...form, is_sale: e.target.checked })}
            />
            On Sale (discount on this product)
          </label>
          {form.is_sale && (
            <input
              type="number"
              name="discount_percent"
              min="1"
              max="100"
              className="w-full border rounded-xl px-4 py-2.5 bg-white"
              placeholder="Discount % (e.g. 20)"
              value={form.discount_percent}
              onChange={handleChange}
            />
          )}
          {(listPrice > 0 || form.cost_price) && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-white px-2 py-2 border">
                <p className="text-slate-400">Web Price</p>
                <p className="font-bold text-emerald-700">Rs. {previewSalePrice.toLocaleString("en-PK")}</p>
              </div>
              <div className="rounded-lg bg-white px-2 py-2 border">
                <p className="text-slate-400">Cost</p>
                <p className="font-bold">Rs. {(parseFloat(form.cost_price) || 0).toLocaleString("en-PK")}</p>
              </div>
              <div className="rounded-lg bg-violet-50 px-2 py-2 border border-violet-100">
                <p className="text-violet-500">Profit / unit</p>
                <p className="font-bold text-violet-700">Rs. {previewProfit.toLocaleString("en-PK")}</p>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select name="category" className="border rounded-xl px-4 py-2.5" value={form.category} onChange={handleChange} required>
            <option value="">Category *</option>
            {(categories.length ? categories : [{ name: "Men" }, { name: "Women" }, { name: "Kids" }]).map((c) => (
              <option key={c.name || c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select name="subcategory" className="border rounded-xl px-4 py-2.5" value={form.subcategory} onChange={handleChange} required>
            <option value="">Subcategory *</option>
            {SUBCATEGORY_NAMES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
          <input type="url" name="product_image" className="w-full border rounded-xl px-4 py-2.5" placeholder="https://..." value={form.product_image} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Or upload image</label>
          <input type="file" accept="image/*" className="w-full border rounded-xl px-4 py-2.5" onChange={(e) => setProductImageFile(e.target.files[0])} />
        </div>
        {existingImage && !productImageFile && (
          <img src={existingImage} alt="current" className="w-24 h-24 object-cover rounded-lg" />
        )}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
            {loading ? "Saving..." : productId ? "Update Product" : "Create Product"}
          </button>
          {productId && (
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-200 py-3 rounded-xl">Cancel</button>
          )}
        </div>
      </form>
    </div>
  );
}
