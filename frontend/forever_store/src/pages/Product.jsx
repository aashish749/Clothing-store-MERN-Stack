import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context";
import { useParams } from "react-router-dom";
import Hr from "../components/Hr";
import Rating from "../components/Rating";
import ReviewDescription from "../components/ReviewDescription";
import RelatedProducts from "../components/RelatedProducts";
import { useNotify } from "../hooks/useNotify";
const Product = () => {
  const { products, setCartCount, fetchCart } = useContext(ShopContext);
  const notify = useNotify();
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState("description"); // 'description' is the default

  const normalizedVariants = (product?.variants || [])
    .map((variant) => ({
      name: String(variant?.name || "").trim(),
      values: Array.isArray(variant?.values)
        ? variant.values
            .map((value) => String(value || "").trim())
            .filter((value) => value)
        : [],
    }))
    .filter((variant) => variant.name && variant.values.length > 0);

  const fetchProductDetail = async () => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.get(
        `${apiBaseUrl}/api/products/detail/${productId}`,
      );

      const productData = response.data?.product;
      if (!productData) {
        setProduct(null);
        return;
      }

      setProduct({
        ...productData,
        image: productData.images || productData.image || [],
        variants: productData.variants || [],
      });
      setSelectedImage(
        (productData.images && productData.images[0]) ||
          (productData.image && productData.image[0]) ||
          "",
      );
    } catch (error) {
      console.error("Failed to fetch product detail:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    fetchProductDetail();
  }, [productId]);

  useEffect(() => {
    if (!product) {
      setSelectedOptions({});
      return;
    }

    const initialSelections = {};

    (product.variants || []).forEach((variant) => {
      const variantName = String(variant?.name || "").trim();
      const variantValues = Array.isArray(variant?.values)
        ? variant.values
            .map((value) => String(value || "").trim())
            .filter((value) => value)
        : [];

      if (variantName && variantValues.length > 0) {
        initialSelections[variantName] = variantValues[0];
      }
    });

    setSelectedOptions(initialSelections);
  }, [product]);

  const relatedProducts = products.filter(
    (item) =>
      item.category === product?.category &&
      item.subCategory === product?.subCategory &&
      item._id !== product?._id,
  );

  const addToCartLoader = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      notify.error("Please login to add this product to cart.");
      return;
    }

    setCartLoading(true);

    try {
      const option1 = normalizedVariants[0];
      const option2 = normalizedVariants[1];

      const option1Value = option1 ? selectedOptions[option1.name] || "" : "";
      const option2Value = option2 ? selectedOptions[option2.name] || "" : "";

      if (option1 && !option1Value) {
        notify.error(`Please select ${option1.name}.`);
        setCartLoading(false);
        return;
      }

      if (option2 && !option2Value) {
        notify.error(`Please select ${option2.name}.`);
        setCartLoading(false);
        return;
      }

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.post(
        `${apiBaseUrl}/api/cart/add`,
        {
          productId: product._id,
          quantity: 1,
          selectedOptions: {
            option1Name: option1?.name || "",
            option1Value,
            option2Name: option2?.name || "",
            option2Value,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const itemCount = response.data?.cart?.summary?.itemCount;
      if (typeof itemCount === "number") {
        setCartCount(itemCount);
      }

      notify.success("Added to cart successfully.");
      fetchCart();
    } catch (error) {
      notify.error(
        error?.response?.data?.message || "Failed to add item to cart.",
      );
    } finally {
      setCartLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="container py-20 text-center">Loading product...</div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <Hr></Hr>

      <div className="container flex flex-col md:flex-row gap-5 md:9">
        <div className="w-full md:w-1/2  max-h-500px flex">
          <div className="flex w-full flex-col md:flex-row gap-4 ">
            <div className="w-full md:w-20 lg:w-24 h-auto overflow-y-auto order-last md:order-first flex flex-row md:flex-col gap-2">
              {/* thumbnail container */}
              {product.image.map((img, index) => {
                const isActive = selectedImage === img;

                return (
                  <button
                    key={index}
                    type="button"
                    className={`mb-2 h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-full flex-none overflow-hidden bg-white aspect-square border transition-colors duration-200 ${isActive ? "border-black/60" : "border-gray-300"}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover cursor-pointer"
                    />
                  </button>
                );
              })}
            </div>
            <div className="flex-1 flex items-center justify-center">
              {/* main image container */}
              {(selectedImage || product.image.length > 0) && (
                <div className="w-full max-w-[420px] aspect-square overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={selectedImage || product.image[0]}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-1.5">
          <h2 className="text-3xl font-medium">
            {product.name || "Unnamed Product"}
          </h2>
          <div className="flex items-center gap-2">
            <Rating rating={Number(product.rating ?? 0)} />
            <span className="text-sm text-gray-500">
              ({Number(product.no_Reviews ?? 0)})
            </span>
          </div>
          <div className="text-3xl font-bold">
            ${product.price?.toFixed(2) || "0.00"}
          </div>
          <div className="flex flex-col gap-4 my-3">
            {normalizedVariants.map((variant) => {
              const selectedValue = selectedOptions[variant.name] || "";

              return (
                <div key={variant.name} className="flex flex-col gap-3">
                  <p>Select {variant.name}</p>
                  <div className="flex flex-wrap gap-3">
                    {variant.values.map((variantValue) => (
                      <button
                        key={`${variant.name}-${variantValue}`}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [variant.name]: variantValue,
                          }))
                        }
                        className={`py-2 px-5 border text-black border-gray-300 hover:bg-black hover:text-white transition-colors duration-300 ${selectedValue === variantValue ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}
                      >
                        {variantValue}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={addToCartLoader}
            disabled={cartLoading}
            className={`py-2.5 mb-3 max-w-50 px-5 bg-black text-white hover:bg-black/80 transition-colors duration-300 ${cartLoading && "bg-black/80"}`}
          >
            {cartLoading ? "ADDED TO CART..." : "ADD TO CART"}
          </button>
          <hr className="text-gray-200 w-full" />
          <p className="text-gray-500 ">
            <span className="block"> 100% Original product.</span>

            <span className="block"> 30 days return policy.</span>

            <span className="block">
              Easy return and exchange policy within 7 days.
            </span>
          </p>
        </div>
      </div>
      <ReviewDescription
        product={product}
        productId={productId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReviewAdded={fetchProductDetail}
      ></ReviewDescription>
      {relatedProducts.length > 0 ? (
        <RelatedProducts product={product} />
      ) : null}
    </div>
  );
};

export default Product;
