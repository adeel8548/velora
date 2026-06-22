import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  fetchCategories,
  fetchSubcategories,
} from "../../services/productService";

const SUBCATEGORY_NAMES = [
  "Watch", "Shoes", "Glasses", "Pants", "Shirt", "Shalwar Kameez",
];

export default function AdminProductForm({
  onSuccess,
  initialData = null,
  productId = null,
  onCancel,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    subcategory: "",
    product_image: "",
    is_sale: false,
    discount_percent: "",
  });
  const [productImageFile, setProductImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    if (initialData) {
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.originalPrice || initialData.price || "",
        stock: initialData.stock ?? "",
        category: initialData.category || "",
        subcategory: initialData.subcategory || "",
        product_image: initialData.productImage || "",
        is_sale: initialData.isSale || false,
        discount_percent: initialData.discountPercent || "",
      });
      setExistingImage(initialData.productImage || null);
    }
  }, [initialData]);

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
        stock: parseInt(form.stock, 10) || 0,
        category: form.category,
        subcategory: form.subcategory,
        product_image: imageUrl,
        images: imageUrl ? [imageUrl] : [],
        is_active: true,
        is_sale: form.is_sale && discount > 0,
        discount_percent: form.is_sale ? discount : 0,
      };

      // Resolve category_id / subcategory_id if categories loaded
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
          <input type="number" name="price" className="border rounded-xl px-4 py-2.5" placeholder="Original Price (PKR) *" value={form.price} onChange={handleChange} required />
          <input type="number" name="stock" className="border rounded-xl px-4 py-2.5" placeholder="Stock qty *" value={form.stock} onChange={handleChange} required min="0" />
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={form.is_sale}
              onChange={(e) => setForm({ ...form, is_sale: e.target.checked })}
            />
            On Sale (this product)
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
