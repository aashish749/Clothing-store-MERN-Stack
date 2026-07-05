import React from "react";
import { useContext } from "react";
import { ShopContext } from "../context";
import { Link } from "react-router-dom";

const Card = ({ product }) => {
  const { addtocart } = useContext(ShopContext);

  const resolvedImage = Array.isArray(product?.image)
    ? product.image[0]
    : Array.isArray(product?.images)
      ? product.images[0]
      : typeof product?.image === "string"
        ? product.image
        : typeof product?.images === "string"
          ? product.images
          : "";

  return (
    <Link to={`/product/${product._id}`}>
      <div className="bg-white  rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md group flex flex-col h-full">
        {/* 1. Fixed Aspect Ratio prevents distortion if image is missing */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
          <img
            src={
              resolvedImage ||
              "https://via.placeholder.com/300x400?text=No+Image"
            }
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            // If the URL is broken, this prevents the layout from collapsing
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/300x400?text=No+Image";
            }}
          />

          {product.isNew && (
            <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase">
              New
            </span>
          )}
        </div>

        <div className="p-3 flex flex-col flex-grow space-y-1">
          <h3 className="text-xs sm:text-sm text-gray-700 font-medium line-clamp-1  group-hover:text-black transition-colors ">
            {product.name || "Unnamed Product"}
          </h3>

          {/* Using your context currency is better, but here is the hardcoded fix */}
          <p className="text-sm sm:text-base font-bold text-gray-900 mt-auto">
            ${product.price ? product.price.toFixed(2) : "0.00"}
          </p>

          {/* <button
            className="hidden sm:block w-full bg-gray-900 text-white text-[10px] sm:text-xs font-semibold py-2 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hover:bg-black/80 transition-colors duration-300 text-xl"
            onClick={() => addtocart(product._id, "M")}
          >
            Add to Cart
          </button> */}
        </div>
      </div>
    </Link>
  );
};

export default Card;
