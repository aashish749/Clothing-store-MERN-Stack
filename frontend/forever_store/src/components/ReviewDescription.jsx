import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNotify } from "../hooks/useNotify";
import { Link } from "react-router-dom";
import { IoStar, IoStarOutline } from "react-icons/io5";
import Rating from "./Rating";
import ReactMarkdown from "react-markdown";

const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

const ReviewDescription = ({
  product,
  productId,
  activeTab,
  setActiveTab,
  onReviewAdded,
}) => {
  const notify = useNotify();
  const token = localStorage.getItem("token");
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingPurchaseStatus, setLoadingPurchaseStatus] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hasPurchased, setHasPurchased] = useState(false);

  const averageRating = useMemo(() => Number(product?.rating ?? 0), [product]);

  const loadReviews = async () => {
    if (!productId) return;

    try {
      setLoadingReviews(true);
      const response = await axios.get(
        `${apiBaseUrl}/api/reviews/products/${productId}/reviews`,
      );
      setReviews(response.data?.reviews || []);
    } catch (error) {
      notify.error(error?.response?.data?.message || "Unable to load reviews.");
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadPurchaseStatus = async () => {
    if (!token || !productId) {
      setHasPurchased(false);
      return;
    }

    try {
      setLoadingPurchaseStatus(true);
      const response = await axios.get(`${apiBaseUrl}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const orders = response.data?.orders || [];
      const purchased = orders.some((order) => {
        const canReviewOrder =
          order.orderStatus !== "Cancelled" &&
          order.orderStatus !== "PaymentFailed" &&
          (order.paymentMethod === "COD" || order.isPaid);

        if (!canReviewOrder) return false;

        return (order.items || []).some((item) => {
          const itemProductId = item.productId?._id || item.productId;
          return itemProductId?.toString() === productId;
        });
      });

      setHasPurchased(purchased);
    } catch (error) {
      console.error("Failed to load purchase status:", error);
      setHasPurchased(false);
    } finally {
      setLoadingPurchaseStatus(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reviews") {
      loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, productId]);

  useEffect(() => {
    if (activeTab === "reviews") {
      loadPurchaseStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, productId, token]);

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!token) {
      notify.error("Please log in to add a review.");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await axios.post(
        `${apiBaseUrl}/api/reviews/products/${productId}/reviews`,
        {
          rating,
          comment: comment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.success) {
        notify.success("Review added successfully.");
        setComment("");
        setRating(5);
        await loadReviews();
        if (onReviewAdded) {
          await onReviewAdded();
        }
      } else {
        notify.error(response.data?.message || "Unable to add review.");
      }
    } catch (error) {
      notify.error(error?.response?.data?.message || "Unable to add review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div>
      <div className="flex mt-8 md:mt-14 container">
        <p
          onClick={() => setActiveTab("description")}
          className={`border border-gray-300 px-5 py-3 text-sm cursor-pointer ${activeTab === "description" ? "font-bold" : ""}`}
        >
          Description
        </p>
        <p
          onClick={() => setActiveTab("reviews")}
          className={`border border-gray-300 px-5 py-3 text-sm cursor-pointer ${activeTab === "reviews" ? "font-bold" : ""}`}
        >
          Reviews ({Number(product?.no_Reviews ?? 0)})
        </p>
      </div>

      <div className="flex border border-gray-300 container flex-col gap-4 border px-6 py-6 text-sm text-gray-500">
        {activeTab === "description" ? (
          <div className="custom-markdown   py-3 text-sm text-gray-600">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col gap-6 text-gray-700">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Customer reviews
                </p>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <Rating rating={averageRating} />
                  <p className="text-sm text-gray-500">
                    ({Number(product?.no_Reviews ?? reviews.length ?? 0)}{" "}
                    reviews)
                  </p>
                </div>
              </div>
            </div>

            {token && hasPurchased && !loadingPurchaseStatus ? (
              <form
                onSubmit={handleSubmitReview}
                className="rounded-none border border-gray-200 bg-gray-50 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      Add your review
                    </p>
                    <h3 className="mt-1 text-base font-medium text-gray-900">
                      Share your experience
                    </h3>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[120px_1fr]">
                  <label className="flex flex-col gap-2 text-sm text-gray-700">
                    Rating
                    <div className="flex items-center gap-1 rounded-none border border-gray-300 bg-white px-3 py-2.5">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const isActive = value <= rating;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            className="text-xl leading-none text-gray-700 transition-colors duration-200 hover:text-black"
                            disabled={submittingReview}
                            aria-label={`${value} star${value > 1 ? "s" : ""}`}
                          >
                            {isActive ? (
                              <IoStar className="text-black" />
                            ) : (
                              <IoStarOutline />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs text-gray-500">
                      {ratingLabels[rating - 1]}
                    </span>
                  </label>

                  <label className="flex flex-col gap-2 text-sm text-gray-700">
                    Comment
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={4}
                      placeholder="Write your review here..."
                      className="rounded-none border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black resize-none"
                      disabled={submittingReview}
                    />
                  </label>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded-none bg-black px-5 py-2.5 text-sm font-medium uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            ) : null}

            <div className="space-y-4">
              {loadingReviews ? (
                <p className="text-sm text-gray-500">Loading reviews...</p>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <article
                    key={review._id}
                    className="rounded-none border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.reviewerName ||
                            review.userId?.name ||
                            "Customer"}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                          {review.reviewType === "imported"
                            ? review.sourcePlatform || "Imported"
                            : "Verified customer"}
                        </p>
                      </div>
                      <Rating rating={Number(review.rating || 0)} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {review.comment || "No comment provided."}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No reviews yet. Be the first to leave one.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewDescription;
