import React from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getProductMetrics = (product) => ({
  description: product.description || "No description",
  markedPrice:
    product.markedPrice != null
      ? `$${Number(product.markedPrice).toFixed(2)}`
      : "-",
  categories:
    (product.categories || [])
      .map((category) => category?.name || category)
      .join(", ") || "None",
  stock: (product.variantStocks || []).reduce(
    (sum, stockRow) => sum + Number(stockRow?.stock || 0),
    0,
  ),
  rating: Number(product.rating || 0).toFixed(1),
  reviews: product.no_Reviews ?? 0,
  createdAt: formatDate(product.createdAt),
  updatedAt: formatDate(product.updatedAt),
});

const ProductTable = ({
  products,
  categoriesById,
  onEdit,
  onDelete,
  visibleColumns = [],
}) => {
  const hasColumn = (key) =>
    visibleColumns.some((column) => column.key === key);

  const renderCellValue = (product, columnKey) => {
    const metrics = getProductMetrics(product);

    switch (columnKey) {
      case "description":
        return metrics.description;
      case "markedPrice":
        return metrics.markedPrice;
      case "categories":
        return metrics.categories;
      case "stock":
        return metrics.stock;
      case "rating":
        return metrics.rating;
      case "reviews":
        return metrics.reviews;
      case "createdAt":
        return metrics.createdAt;
      case "updatedAt":
        return metrics.updatedAt;
      default:
        return "-";
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:hidden">
        {products.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500">
            No products found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {products.map((product) => {
              const image = product.images?.[0];
              const metrics = getProductMetrics(product);

              return (
                <article key={product._id} className="space-y-4 p-5">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {metrics.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Price
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        ${Number(product.price || 0).toFixed(2)}
                      </p>
                    </div>
                    {hasColumn("markedPrice") && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Marked price
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {metrics.markedPrice}
                        </p>
                      </div>
                    )}
                    {hasColumn("categories") && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Categories
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {metrics.categories}
                        </p>
                      </div>
                    )}
                    {hasColumn("stock") && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Stock
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {metrics.stock}
                        </p>
                      </div>
                    )}
                    {hasColumn("rating") && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Rating
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {metrics.rating}
                        </p>
                      </div>
                    )}
                    {hasColumn("reviews") && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Reviews
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {metrics.reviews}
                        </p>
                      </div>
                    )}
                    {hasColumn("createdAt") && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Created
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {metrics.createdAt}
                        </p>
                      </div>
                    )}
                    {hasColumn("updatedAt") && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Updated
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {metrics.updatedAt}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Product</th>
                {visibleColumns.map((column) => (
                  <th key={column.key} className="px-5 py-4 font-medium">
                    {column.label}
                  </th>
                ))}
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 2}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const image = product.images?.[0];
                  const categoryNames = (product.categories || []).map(
                    (category) => {
                      const categoryId = category?._id || category;
                      return (
                        categoriesById[categoryId] ||
                        category?.name ||
                        "Category"
                      );
                    },
                  );
                  const metrics = getProductMetrics(product);

                  return (
                    <tr key={product._id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            {image ? (
                              <img
                                src={image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      {visibleColumns.map((column) => (
                        <td
                          key={column.key}
                          className="px-5 py-4 text-slate-900"
                        >
                          {column.key === "categories"
                            ? metrics.categories
                            : renderCellValue(product, column.key)}
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(product)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(product)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                          >
                            <FiTrash2 /> Delete
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
    </div>
  );
};

export default ProductTable;
