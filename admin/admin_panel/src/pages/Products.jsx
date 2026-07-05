import React, { useEffect, useMemo, useState } from "react";
import { FiPlus, FiRefreshCw, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";
import ProductForm from "../components/admin/products/ProductForm";
import ProductTable from "../components/admin/products/ProductTable";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest" },
  { value: "createdAt:asc", label: "Oldest" },
  { value: "price:desc", label: "Price high to low" },
  { value: "price:asc", label: "Price low to high" },
  { value: "rating:desc", label: "Rating high to low" },
  { value: "rating:asc", label: "Rating low to high" },
  { value: "stock:desc", label: "Stock high to low" },
  { value: "stock:asc", label: "Stock low to high" },
  { value: "sales:desc", label: "Sales high to low" },
  { value: "sales:asc", label: "Sales low to high" },
];

const productColumns = [
  {
    key: "description",
    label: "Description",
    defaultVisible: false,
    alwaysOnMobile: true,
  },
  {
    key: "markedPrice",
    label: "Marked Price",
    defaultVisible: true,
    alwaysOnMobile: true,
  },
  {
    key: "categories",
    label: "Categories",
    defaultVisible: true,
    alwaysOnMobile: true,
  },
  { key: "stock", label: "Stock", defaultVisible: true, alwaysOnMobile: true },
  {
    key: "rating",
    label: "Rating",
    defaultVisible: true,
    alwaysOnMobile: true,
  },
  { key: "reviews", label: "Reviews", defaultVisible: false },
  { key: "createdAt", label: "Created", defaultVisible: false },
  { key: "updatedAt", label: "Updated", defaultVisible: false },
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("createdAt:desc");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [activeProduct, setActiveProduct] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(() =>
    productColumns
      .filter((column) => column.defaultVisible)
      .map((column) => column.key),
  );

  const categoriesById = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [category._id, category.name]),
      ),
    [categories],
  );

  const visibleColumnConfig = useMemo(
    () =>
      productColumns.filter((column) => visibleColumns.includes(column.key)),
    [visibleColumns],
  );

  const toggleColumn = (columnKey) => {
    setVisibleColumns((current) =>
      current.includes(columnKey)
        ? current.filter((key) => key !== columnKey)
        : [...current, columnKey],
    );
  };

  const loadProducts = async ({
    nextPage = page,
    nextKeyword = keyword,
    nextCategory = categoryId,
    nextSortBy = sortBy,
  } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("pageNumber", String(nextPage));
      if (nextKeyword.trim()) params.set("keyword", nextKeyword.trim());
      if (nextCategory) params.set("category", nextCategory);

      const [sortField, sortDirection] = String(nextSortBy || "")
        .split(":")
        .map((value) => value.trim());
      if (sortField) params.set("sortBy", sortField);
      if (sortDirection) params.set("sortOrder", sortDirection);

      const { data } = await adminApi.get(
        `/api/products/list?${params.toString()}`,
      );
      setProducts(data.products || []);
      setPage(data.page || nextPage);
      setPages(data.pages || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await adminApi.get("/api/categories/list");
      setCategories(data.categories || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load categories");
    }
  };

  const refreshAll = async (options) => {
    setRefreshing(true);
    try {
      await Promise.all([loadProducts(options), loadCategories()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAll({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    refreshAll({
      nextPage: 1,
      nextKeyword: keyword,
      nextCategory: categoryId,
      nextSortBy: sortBy,
    });
  };

  const handleSortChange = (event) => {
    const nextSortBy = event.target.value;
    setSortBy(nextSortBy);
    refreshAll({
      nextPage: 1,
      nextKeyword: keyword,
      nextCategory: categoryId,
      nextSortBy,
    });
  };

  const openCreateForm = () => {
    setMode("create");
    setActiveProduct(null);
    setIsFormOpen(true);
  };

  const openEditForm = (product) => {
    setMode("edit");
    setActiveProduct(product);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setActiveProduct(null);
  };

  const handleSaveProduct = async (payload, files) => {
    setSaving(true);
    try {
      let requestBody;

      if (files && files.length > 0) {
        requestBody = new FormData();
        requestBody.append("name", payload.name);
        requestBody.append("description", payload.description || "");
        requestBody.append("price", String(payload.price));
        if (payload.markedPrice != null) {
          requestBody.append("markedPrice", String(payload.markedPrice));
        }
        requestBody.append(
          "categories",
          JSON.stringify(payload.categories || []),
        );
        requestBody.append("variants", JSON.stringify(payload.variants || []));
        requestBody.append(
          "variantStocks",
          JSON.stringify(payload.variantStocks || []),
        );
        if (payload.images !== undefined) {
          requestBody.append("images", JSON.stringify(payload.images));
        }
        files.forEach((file) => {
          requestBody.append("images", file);
        });
      } else {
        requestBody = {
          ...payload,
          categories: JSON.stringify(payload.categories || []),
          variants: JSON.stringify(payload.variants || []),
          variantStocks: JSON.stringify(payload.variantStocks || []),
          ...(payload.images !== undefined
            ? { images: JSON.stringify(payload.images) }
            : {}),
        };
      }

      if (mode === "create") {
        await adminApi.post("/api/products/create", requestBody, {
          headers: {
            ...getAdminAuthHeaders(),
            ...(requestBody instanceof FormData
              ? { "Content-Type": "multipart/form-data" }
              : {}),
          },
        });
        toast.success("Product created successfully");
      } else if (activeProduct?._id) {
        await adminApi.put(
          `/api/products/update/${activeProduct._id}`,
          requestBody,
          {
            headers: {
              ...getAdminAuthHeaders(),
              ...(requestBody instanceof FormData
                ? { "Content-Type": "multipart/form-data" }
                : {}),
            },
          },
        );
        toast.success("Product updated successfully");
      }

      closeForm();
      await refreshAll({
        nextPage: 1,
        nextKeyword: keyword,
        nextCategory: categoryId,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    const shouldDelete = window.confirm(
      `Delete ${product.name}? This cannot be undone.`,
    );

    if (!shouldDelete) return;

    setDeletingId(product._id);
    try {
      await adminApi.delete(`/api/products/delete/${product._id}`, {
        headers: getAdminAuthHeaders(),
      });
      toast.success("Product deleted");
      await refreshAll({
        nextPage: 1,
        nextKeyword: keyword,
        nextCategory: categoryId,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Product management
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Products
            </h1>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Filter product columns
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                refreshAll({
                  nextPage: page,
                  nextKeyword: keyword,
                  nextCategory: categoryId,
                  nextSortBy: sortBy,
                })
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <FiPlus /> Add product
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]"
        >
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FiSearch className="text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search products by name"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>

          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={handleSortChange}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            Search
          </button>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Showing</p>
          <h3 className="mt-3 text-3xl font-semibold text-slate-900">
            {products.length}
          </h3>
          <p className="mt-2 text-sm text-slate-500">Products on this page</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Categories</p>
          <h3 className="mt-3 text-3xl font-semibold text-slate-900">
            {categories.length}
          </h3>
          <p className="mt-2 text-sm text-slate-500">Available collections</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pages</p>
          <h3 className="mt-3 text-3xl font-semibold text-slate-900">
            {pages}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Current pagination total
          </p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Table columns
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Filter Columns
            </h2>
            <p className="mt-2 text-sm text-slate-600"></p>
          </div>

          <div className="flex flex-wrap gap-2">
            {productColumns.map((column) => {
              const isVisible = visibleColumns.includes(column.key);
              return (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => toggleColumn(column.key)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${isVisible ? "border-black bg-black text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}
                >
                  {column.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading products...
          </div>
        ) : (
          <ProductTable
            products={products}
            categoriesById={categoriesById}
            onEdit={openEditForm}
            onDelete={handleDeleteProduct}
            deletingId={deletingId}
            visibleColumns={visibleColumnConfig}
          />
        )}
      </section>

      <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-500">
          Page {page} of {pages}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              refreshAll({
                nextPage: page - 1,
                nextKeyword: keyword,
                nextCategory: categoryId,
                nextSortBy: sortBy,
              })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() =>
              refreshAll({
                nextPage: page + 1,
                nextKeyword: keyword,
                nextCategory: categoryId,
                nextSortBy: sortBy,
              })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <ProductForm
        open={isFormOpen}
        mode={mode}
        product={activeProduct}
        categories={categories}
        onClose={closeForm}
        onSubmit={handleSaveProduct}
        submitting={saving}
      />
    </div>
  );
};

export default Products;
