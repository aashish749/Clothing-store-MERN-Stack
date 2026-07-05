import React, { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [productId, setProductId] = useState("all");
  const [rating, setRating] = useState("all");
  const [loading, setLoading] = useState(true);
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [saveReviewLoading, setSaveReviewLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    productId: "",
    reviewerName: "",
    rating: 5,
    comment: "",
    sourcePlatform: "",
  });

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/reviews/admin/all", {
        headers: getAdminAuthHeaders(),
      });
      setReviews(data.reviews || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const firstResponse = await adminApi.get(
        "/api/products/list?pageNumber=1",
      );
      const totalPages = firstResponse.data?.pages || 1;
      let allProducts = [...(firstResponse.data?.products || [])];

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await adminApi.get(
          `/api/products/list?pageNumber=${page}`,
        );
        allProducts = [...allProducts, ...(response.data?.products || [])];
      }

      setProducts(allProducts);
      if (!reviewForm.productId && allProducts[0]?._id) {
        setReviewForm((current) => ({
          ...current,
          productId: allProducts[0]._id,
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load products");
    }
  };

  useEffect(() => {
    loadReviews();
    loadProducts();
  }, []);

  const productOptions = useMemo(() => {
    const uniqueProducts = new Map();

    reviews.forEach((review) => {
      const id = String(review.productId?._id || "");
      const name = review.productId?.name || "Product";
      if (id && !uniqueProducts.has(id)) {
        uniqueProducts.set(id, name);
      }
    });

    return Array.from(uniqueProducts, ([value, label]) => ({ value, label }));
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const search = query.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesType = type === "all" || review.reviewType === type;
      const matchesProduct =
        productId === "all" || String(review.productId?._id) === productId;
      const matchesRating =
        rating === "all" || Number(review.rating || 0) === Number(rating);
      const matchesSearch =
        !search ||
        String(review.reviewerName || "")
          .toLowerCase()
          .includes(search) ||
        String(review.productId?.name || "")
          .toLowerCase()
          .includes(search) ||
        String(review.comment || "")
          .toLowerCase()
          .includes(search);

      return matchesType && matchesProduct && matchesRating && matchesSearch;
    });
  }, [reviews, query, type, productId, rating]);

  const metrics = useMemo(() => {
    const total = reviews.length;
    const imported = reviews.filter(
      (review) => review.reviewType === "imported",
    ).length;
    const internal = reviews.filter(
      (review) => review.reviewType === "internal",
    ).length;
    const average =
      total === 0
        ? 0
        : reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          total;

    return [
      { label: "Reviews", value: total },
      { label: "Average", value: average.toFixed(1) },
      { label: "Imported", value: imported },
      { label: "Internal", value: internal },
    ];
  }, [reviews]);

  const openReview = (review) => {
    setSelectedReview(review);
    setDetailOpen(true);
  };

  const openAddReview = () => {
    setReviewForm((current) => ({
      ...current,
      productId: current.productId || products[0]?._id || "",
    }));
    setAddReviewOpen(true);
  };

  const closeAddReview = () => {
    if (saveReviewLoading) return;
    setAddReviewOpen(false);
  };

  const closeReview = () => {
    if (deleting) return;
    setDetailOpen(false);
    setSelectedReview(null);
  };

  const handleDeleteReview = async (reviewId) => {
    const review =
      selectedReview || reviews.find((item) => item._id === reviewId);
    if (!review) return;

    const confirmed = window.confirm(
      `Delete review from ${review.reviewerName || "this user"}?`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await adminApi.delete(`/api/reviews/${reviewId}`, {
        headers: getAdminAuthHeaders(),
      });

      toast.success("Review deleted");
      setReviews((current) => current.filter((item) => item._id !== reviewId));

      if (selectedReview?._id === reviewId) {
        closeReview();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddReview = async (event) => {
    event.preventDefault();

    if (!reviewForm.productId || !reviewForm.reviewerName.trim()) {
      toast.error("Product and reviewer name are required");
      return;
    }

    setSaveReviewLoading(true);
    try {
      await adminApi.post(
        "/api/reviews/admin",
        {
          productId: reviewForm.productId,
          reviewerName: reviewForm.reviewerName,
          rating: Number(reviewForm.rating || 0),
          comment: reviewForm.comment,
          sourcePlatform: reviewForm.sourcePlatform,
        },
        {
          headers: getAdminAuthHeaders(),
        },
      );

      toast.success("Review added");
      setAddReviewOpen(false);
      setReviewForm({
        productId: products[0]?._id || "",
        reviewerName: "",
        rating: 5,
        comment: "",
        sourcePlatform: "",
      });
      await loadReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add review");
    } finally {
      setSaveReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Reviews
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Review moderation
        </h1>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-slate-500">
                {metric.label}
              </p>
              <h3 className="mt-2 text-3xl font-semibold text-slate-900">
                {metric.value}
              </h3>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FiSearch className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reviews"
              className="w-full bg-transparent outline-none"
            />
          </label>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          >
            <option value="all">All types</option>
            <option value="internal">Internal</option>
            <option value="imported">Imported</option>
          </select>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          >
            <option value="all">All products</option>
            {productOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          >
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value > 1 ? "s" : ""}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {filteredReviews.length} shown
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Add imported reviews, then filter by product or rating.
          </p>
          <button
            type="button"
            onClick={openAddReview}
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <FiPlus />
            Add review
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-12 text-center text-slate-500">
            Loading reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500">
            No reviews found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Product</th>
                  <th className="px-5 py-4 font-medium">Reviewer</th>
                  <th className="px-5 py-4 font-medium">Rating</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 font-medium">Source</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((review) => (
                  <tr key={review._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {review.productId?.name || "Product"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {review.reviewerName || review.userId?.name || "User"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {Number(review.rating || 0).toFixed(1)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {review.reviewType}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {review.sourcePlatform || "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReview(review)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          Open
                          <FiArrowRight />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review._id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Review details
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedReview?.productId?.name || "Review"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeReview}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            {selectedReview ? (
              <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
                <div className="px-5 py-5 sm:px-6">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: "Product",
                        value: selectedReview.productId?.name || "Product",
                      },
                      {
                        label: "Reviewer",
                        value:
                          selectedReview.reviewerName ||
                          selectedReview.userId?.name ||
                          "User",
                      },
                      {
                        label: "Rating",
                        value: Number(selectedReview.rating || 0).toFixed(1),
                      },
                      {
                        label: "Date",
                        value: formatDateTime(selectedReview.createdAt),
                      },
                    ].map((item) => (
                      <article
                        key={item.label}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {item.value}
                        </p>
                      </article>
                    ))}
                  </div>

                  <section className="mt-5 rounded-3xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Comment
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {selectedReview.comment || "No comment provided."}
                    </p>
                  </section>

                  <section className="mt-5 rounded-3xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Product actions
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setProductId(
                            String(selectedReview.productId?._id || "all"),
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        Show product reviews
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(selectedReview._id)}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiTrash2 />
                        {deleting ? "Deleting..." : "Delete review"}
                      </button>
                    </div>
                  </section>
                </div>

                <aside className="border-t border-slate-200 bg-slate-50 px-5 py-5 lg:border-l lg:border-t-0 sm:px-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Source
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Review metadata
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Type
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedReview.reviewType}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Source platform
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedReview.sourcePlatform || "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        User
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedReview.userId?.name ||
                          selectedReview.userId?.email ||
                          "-"}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {addReviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Add review
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  Create imported review
                </h2>
              </div>
              <button
                type="button"
                onClick={closeAddReview}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="px-5 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Product
                  </span>
                  <select
                    value={reviewForm.productId}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        productId: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Reviewer name
                  </span>
                  <input
                    value={reviewForm.reviewerName}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        reviewerName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Rating
                  </span>
                  <select
                    value={reviewForm.rating}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        rating: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} star{value > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Comment
                  </span>
                  <textarea
                    rows="4"
                    value={reviewForm.comment}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        comment: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Source platform
                  </span>
                  <input
                    value={reviewForm.sourcePlatform}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        sourcePlatform: event.target.value,
                      }))
                    }
                    placeholder="Facebook, Google, etc."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saveReviewLoading}
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveReviewLoading ? "Saving..." : "Save review"}
                </button>
                <button
                  type="button"
                  onClick={closeAddReview}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Reviews;
