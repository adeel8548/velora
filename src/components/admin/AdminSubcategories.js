import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Modal from "../Modal";
import {
  fetchSubcategoriesAdmin,
  fetchCategoriesAdmin,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../../services/categoryService";
import { uploadProductImage } from "../../services/productService";

export default function AdminSubcategories() {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    const [subs, cats] = await Promise.all([
      fetchSubcategoriesAdmin(),
      fetchCategoriesAdmin(),
    ]);
    setSubcategories(subs);
    setCategories(cats);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setCategoryId("");
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setShowModal(false);
  };

  const edit = (sub) => {
    setEditId(sub.id);
    setName(sub.name);
    setCategoryId(sub.category_id || sub.category?.id || "");
    setDescription(sub.description || "");
    setImageUrl(sub.image_url || "");
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      Swal.fire("Error", "Select a parent category", "warning");
      return;
    }
    setLoading(true);
    try {
      let img = imageUrl;
      if (imageFile) img = await uploadProductImage(imageFile);

      const payload = { name, category_id: categoryId, description, image_url: img };

      if (editId) {
        await updateSubcategory(editId, payload);
        Swal.fire("Updated", "Subcategory updated", "success");
      } else {
        await createSubcategory(payload);
        Swal.fire("Created", "Subcategory added", "success");
      }
      load();
      resetForm();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    const res = await Swal.fire({ title: "Delete?", icon: "warning", showCancelButton: true });
    if (!res.isConfirmed) return;
    try {
      await deleteSubcategory(id);
      load();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filtered = subcategories.filter((s) =>
    `${s.name} ${s.category?.name || ""}`.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Subcategories</h2>
          <p className="text-slate-500">Watch, Shoes, Shirt, etc. under each category</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold">
          + Add Subcategory
        </button>
      </div>

      <input type="search" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mb-4 border rounded-xl px-4 py-2.5" />

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Parent Category</th>
              <th className="text-left p-4">Description</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub) => (
              <tr key={sub.id} className="border-b border-slate-50">
                <td className="p-4 font-semibold">{sub.name}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                    {sub.category?.name || "—"}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{sub.description || "—"}</td>
                <td className="p-4">
                  <button type="button" onClick={() => edit(sub)} className="text-blue-600 mr-3 font-medium">Edit</button>
                  <button type="button" onClick={() => remove(sub.id)} className="text-red-600 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} title={editId ? "Edit Subcategory" : "Add Subcategory"} onClose={resetForm}>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full border rounded-xl px-4 py-2.5" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <select className="w-full border rounded-xl px-4 py-2.5" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Parent Category *</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <textarea className="w-full border rounded-xl px-4 py-2.5" placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="w-full border rounded-xl px-4 py-2.5" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <input type="file" accept="image/*" className="w-full" onChange={(e) => setImageFile(e.target.files[0])} />
          <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold">
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
