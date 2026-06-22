import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Modal from "../Modal";
import {
  fetchCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";
import { uploadProductImage } from "../../services/productService";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const load = () => fetchCategoriesAdmin().then(setCategories).catch(() => {});

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setShowModal(false);
  };

  const edit = (cat) => {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setImageUrl(cat.image_url || "");
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let img = imageUrl;
      if (imageFile) img = await uploadProductImage(imageFile);

      if (editId) {
        await updateCategory(editId, { name, description, image_url: img });
        Swal.fire("Updated", "Category updated", "success");
      } else {
        await createCategory({ name, description, image_url: img });
        Swal.fire("Created", "Category added", "success");
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
    const res = await Swal.fire({
      title: "Delete category?",
      icon: "warning",
      showCancelButton: true,
    });
    if (!res.isConfirmed) return;
    try {
      await deleteCategory(id);
      load();
      Swal.fire("Deleted", "", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Categories</h2>
          <p className="text-slate-500">Men, Women, Kids — add & manage</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold">
          + Add Category
        </button>
      </div>

      <input
        type="search"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-4 border rounded-xl px-4 py-2.5"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div key={cat.id} className="bg-white border rounded-2xl p-5 shadow-sm">
            {cat.image_url && (
              <img src={cat.image_url} alt={cat.name} className="w-full h-32 object-cover rounded-xl mb-3" />
            )}
            <h3 className="font-bold text-lg">{cat.name}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{cat.description || "—"}</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => edit(cat)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">Edit</button>
              <button type="button" onClick={() => remove(cat.id)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} title={editId ? "Edit Category" : "Add Category"} onClose={resetForm}>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full border rounded-xl px-4 py-2.5" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <textarea className="w-full border rounded-xl px-4 py-2.5" placeholder="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="w-full border rounded-xl px-4 py-2.5" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <input type="file" accept="image/*" className="w-full border rounded-xl px-4 py-2.5" onChange={(e) => setImageFile(e.target.files[0])} />
          <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold">
            {loading ? "Saving..." : editId ? "Update" : "Create"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
