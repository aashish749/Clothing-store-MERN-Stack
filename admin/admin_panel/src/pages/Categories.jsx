import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiEdit3 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";
import ManageCategoryModal from "../components/admin/categories/ManageCategoryModal";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [modalCategory, setModalCategory] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/categories/list");
      setCategories(data.categories || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return toast.error("Enter category name");
    try {
      await adminApi.post(
        "/api/categories/create",
        { name },
        { headers: getAdminAuthHeaders() },
      );
      toast.success("Category created");
      setNewName("");
      await loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category '${category.name}'?`)) return;
    try {
      await adminApi.delete(`/api/categories/delete/${category._id}`, {
        headers: getAdminAuthHeaders(),
      });
      toast.success("Category removed");
      await loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditingName(category.name);
  };

  const saveEdit = async (categoryId) => {
    const name = editingName.trim();
    if (!name) return toast.error("Enter category name");
    try {
      await adminApi.put(
        `/api/categories/update/${categoryId}`,
        { name },
        { headers: getAdminAuthHeaders() },
      );
      toast.success("Category updated");
      setEditingId(null);
      setEditingName("");
      await loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update category");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Category management
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Categories
            </h1>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mt-6 flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          />
          <button className="rounded-2xl bg-black px-4 py-3 text-white">
            Create
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <h2 className="text-lg font-semibold">All categories</h2>
        <div className="mt-4">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : categories.length === 0 ? (
            <p className="text-slate-500">No categories found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-medium">
                      {editingId === cat._id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="rounded border px-2 py-1"
                        />
                      ) : (
                        cat.name
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{cat._id}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === cat._id ? null : (
                      <button
                        onClick={() => startEdit(cat)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      >
                        {" "}
                        <FiEdit3 /> Edit
                      </button>
                    )}
                    {editingId === cat._id ? (
                      <>
                        <button
                          onClick={() => saveEdit(cat._id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setModalCategory(cat)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        >
                          {" "}
                          Manage products
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
                        >
                          {" "}
                          <FiTrash2 /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {modalCategory && (
        <ManageCategoryModal
          category={modalCategory}
          onClose={() => {
            setModalCategory(null);
            loadCategories();
          }}
        />
      )}
    </div>
  );
};

export default Categories;
