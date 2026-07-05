import React from "react";
import { assets } from "../assets/frontend_assets/assets";
import { useContext, useState } from "react";
import { ShopContext } from "../context";
import { FiMinus, FiPlus } from "react-icons/fi";

const CartCard = ({ product }) => {
  const { updateCart, deleteCart } = useContext(ShopContext);
  const selectedOptionChips = [
    product?.selectedOptions?.option1Name &&
    product?.selectedOptions?.option1Value
      ? `${product.selectedOptions.option1Name}: ${product.selectedOptions.option1Value}`
      : product?.size
        ? product.size
        : null,
    product?.selectedOptions?.option2Name &&
    product?.selectedOptions?.option2Value
      ? `${product.selectedOptions.option2Name}: ${product.selectedOptions.option2Value}`
      : null,
  ].filter(Boolean);
  //   const updateCartQuantity = ({ product, input_quantity}) => {
  //     let tempObject = structuredClone(cartItems)
  //     if (input_quantity === 0)
  //     {delete tempObject[product.pro]}
  //     // const tempArray = cartItemsArray.map((item) => {
  //     //   if (item.productid === product.productid) {
  //     //     return { ...item, quantity: input_quantity };
  //     //   }
  //     //   return item;
  //     // });
  //     // setCartItemsArray(tempArray);
  //   };
  return (
    <div>
      <div className="container px-3 py-4 md:py-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_40px] items-start md:items-center gap-3 md:gap-4 lg:gap-8 w-full">
          <div className="flex gap-3 items-start md:items-center min-w-0">
            <div className="image w-16 sm:w-20 bg-gray-100 shrink-0">
              <img
                src={product.image}
                alt=""
                className="w-full object-center object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 min-w-0 pt-1 md:pt-0">
              <h3 className="text-base sm:text-lg md:text-xl font-medium truncate leading-tight">
                {product.name}
              </h3>
              <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
                <div className="text-base sm:text-lg">$ {product.price}</div>
                {selectedOptionChips.map((optionLabel) => (
                  <div
                    key={optionLabel}
                    className="px-2 sm:px-3 py-1 bg-gray-100 border border-gray-200 text-[11px] sm:text-sm"
                  >
                    {optionLabel}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <input
              type="number"
              defaultValue={product.quantity}
              min={1}
              placeholder="Quantity"
              className="w-20 text-center px-2 py-2 border border-gray-200 outline-none"
              onChange={(element) =>
                updateCart({
                  itemId: product.itemId,
                  quantity: Number(element.target.value),
                })
              }
            />
          </div>

          <div
            className="hidden md:flex justify-end"
            onClick={() =>
              deleteCart({
                itemId: product.itemId,
              })
            }
          >
            <img src={assets.bin_icon} className="h-5.5" alt="Delete" />
          </div>

          <div className="flex items-center justify-between gap-3 md:hidden pl-[4.75rem] pr-1">
            <div className="flex items-center border border-gray-200 bg-white overflow-hidden">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                onClick={() =>
                  updateCart({
                    itemId: product.itemId,
                    quantity: Math.max(1, Number(product.quantity || 1) - 1),
                  })
                }
              >
                <FiMinus className="text-[14px]" />
              </button>

              <div className="w-10 h-8 flex items-center justify-center text-sm text-gray-800 border-x border-gray-200">
                {product.quantity}
              </div>

              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                onClick={() =>
                  updateCart({
                    itemId: product.itemId,
                    quantity: Number(product.quantity || 1) + 1,
                  })
                }
              >
                <FiPlus className="text-[14px]" />
              </button>
            </div>

            <button
              type="button"
              className="shrink-0 p-1"
              onClick={() =>
                deleteCart({
                  itemId: product.itemId,
                })
              }
            >
              <img src={assets.bin_icon} className="h-5" alt="Delete" />
            </button>
          </div>
        </div>
      </div>
      <div className="container px-3 ">
        <hr className="container text-gray-200 w-full mt-1" />
      </div>
    </div>
  );
};

export default CartCard;
