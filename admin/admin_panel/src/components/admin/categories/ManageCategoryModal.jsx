import React, { useEffect, useState } from "react";
import adminApi, { getAdminAuthHeaders } from "../../../lib/adminApi";
import { toast } from "react-hot-toast";

const ManageCategoryModal = ({ category, onClose }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const all = [];
      let page = 1;
      let totalPages = 1;
      do {
        const { data } = await adminApi.get(
          `/api/products/list?pageNumber=${page}`,
        );
        if (!data) break;
        const list = data.products || data.items || [];
        all.push(...list);
        totalPages = data.pages || 1;
        page += 1;
      } while (page <= totalPages);
      setProducts(all);
      const sel = new Set();
      all.forEach((p) => {
        if (
          Array.isArray(p.categories) &&
          p.categories.includes(category._id)
        ) {
          sel.add(p._id);
        }
      });
      setSelected(sel);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category && category._id) fetchAllProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const toggle = (productId) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(productId)) n.delete(productId);
      else n.add(productId);
      return n;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [];
      for (const p of products) {
        const has =
          Array.isArray(p.categories) && p.categories.includes(category._id);
        const nowHas = selected.has(p._id);
        if (has !== nowHas) {
          const cur = Array.isArray(p.categories) ? [...p.categories] : [];
          const newCats = nowHas
            ? [...new Set([...cur, category._id])]
            : cur.filter((c) => c !== category._id);
          updates.push(
            adminApi.put(
              `/api/products/update/${p._id}`,
              { categories: JSON.stringify(newCats) },
              { headers: getAdminAuthHeaders() },
            ),
          );
        }
      }
      if (updates.length === 0) {
        toast.success("No changes");
        onClose();
        return;
      }
      await Promise.all(updates);
      toast.success("Category assignments updated");
      onClose();
    } catch (err) {
      toast.error("Failed to update products");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Manage products for "{category?.name}"
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-2xl border px-3 py-2">
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-3 py-2 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-slate-500">Loading products...</p>
          ) : (
            <div className="grid gap-3">
              {products.map((p) => (
                <label
                  key={p._id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p._id)}
                    onChange={() => toggle(p._id)}
                  />

                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-slate-500">{p._id}</div>
                  </div>

                  <div className="text-sm text-slate-500">
                    ${p.price?.toFixed?.(2) ?? p.price}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCategoryModal;
