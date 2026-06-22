import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageLoader from "../PageLoader";
import AdminProductForm from "./AdminProductForm";
import Modal from "../Modal";
import ProductImage from "../ProductImage";
import {
  fetchAdminProducts,
  deleteProduct,
} from "../../services/productService";
import { getStockBadge, getProductProfit } from "../../lib/mappers";
import { formatPKR } from "../../lib/format";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (e) {
      Swal.fire("Error", e.message || "Could not load products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    const res = await Swal.fire({
      title: "Delete product?",
      text: "This will permanently delete the product.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (!res.isConfirmed) return;
    try {
      await deleteProduct(id);
      load();
      Swal.fire("Deleted", "Product removed", "success");
    } catch (e) {
      Swal.fire("Error", e.message || "Could not delete", "error");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stockCounts = {
    high: products.filter((p) => p.stockLevel === "high").length,
    medium: products.filter((p) => p.stockLevel === "medium").length,
    low: products.filter((p) => p.stockLevel === "low").length,
    out: products.filter((p) => p.stockLevel === "out").length,
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600 mt-1">Manage inventory via Supabase</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
        >
          + Add Product
        </button>
      </div>

      {/* Stock summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { key: "high", label: "High Stock", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
          { key: "medium", label: "Medium", color: "bg-amber-50 border-amber-200 text-amber-800" },
          { key: "low", label: "Low Stock", color: "bg-orange-50 border-orange-200 text-orange-800" },
          { key: "out", label: "Out of Stock", color: "bg-red-50 border-red-200 text-red-800" },
        ].map((s) => (
          <div key={s.key} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-sm font-medium">{s.label}</p>
            <p className="text-2xl font-bold">{stockCounts[s.key]}</p>
          </div>
        ))}
      </div>

      <input
        type="search"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30"
      />

      {loading ? (
        <PageLoader fullScreen={false} />
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Selling Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Cost</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Profit</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((p) => {
                const badge = getStockBadge(p.stock, p.stockLevel);
                const profit = getProductProfit(p);
                const sellingPrice = p.salePrice ?? p.price;
                const onSale = p.isSale && p.discountPercent > 0;

                return (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                          <ProductImage src={p.productImage} alt={p.name} productId={p._id} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold line-clamp-1">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.subcategory}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {onSale ? (
                        <div>
                          <p className="font-bold text-emerald-700">{formatPKR(sellingPrice)}</p>
                          <p className="text-xs text-slate-400 line-through">{formatPKR(p.originalPrice)}</p>
                          <span className="text-xs font-bold text-amber-600">{p.discountPercent}% OFF</span>
                        </div>
                      ) : (
                        <span className="font-bold">{formatPKR(sellingPrice)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{formatPKR(p.costPrice)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${profit >= 0 ? "text-violet-700" : "text-red-600"}`}>
                        {formatPKR(profit)}
                      </span>
                      <p className="text-[10px] text-slate-400">per unit</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                        {badge.label} ({badge.qty})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 px-2 py-1 rounded text-sm">{p.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setEditingProduct(p); setShowModal(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Edit</button>
                        <button type="button" onClick={() => remove(p._id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        title={editingProduct ? "Edit Product" : "Add Product"}
        onClose={() => { setShowModal(false); setEditingProduct(null); }}
        size="2xl"
      >
        <AdminProductForm
          initialData={editingProduct}
          productId={editingProduct?._id}
          onSuccess={() => { setShowModal(false); setEditingProduct(null); load(); }}
          onCancel={() => { setShowModal(false); setEditingProduct(null); }}
        />
      </Modal>
    </div>
  );
}
