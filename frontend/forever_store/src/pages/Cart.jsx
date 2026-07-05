import React, { useState } from "react";
import Title from "../components/Title";
import { TitleLeft } from "../components/Title";
import Footer from "../components/Footer";
import { useContext } from "react";
import { ShopContext } from "../context";
import CartCard from "../components/CartCard";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useId } from "react";

const Cart = () => {
  const { cartShippingFee, currency, cartItemsArray, cartTotal } =
    useContext(ShopContext);
  const id = useId();
  const isCartEmpty = cartItemsArray.length === 0;
  return (
    <div>
      <div>
        <hr className="container text-gray-200 mb-8" />
        <div className="mt-12">
          <TitleLeft text1="YOUR " text2="CART" />
          <div className="container px-3 my-3">
            <hr className="   container  text-gray-200 w-full" />
          </div>{" "}
          {isCartEmpty ? (
            <div className="container px-3 py-8 sm:py-10">
              <div className="max-w-2xl mx-auto rounded-none border border-dashed border-gray-300 bg-gray-50 p-6 sm:p-8 text-center">
                <h2 className="text-2xl sm:text-3xl font-medium text-gray-900">
                  Your cart is empty
                </h2>
                <p className="mt-3 text-sm sm:text-base text-gray-600">
                  Add some products to see them here, review quantities, and
                  proceed to checkout.
                </p>
                <div className="mt-6">
                  <Link
                    to="/collection"
                    className="inline-flex items-center justify-center rounded-none bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/80 transition-colors duration-300"
                  >
                    Start shopping
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            cartItemsArray.map((product) => {
              const uniqueKey =
                product.itemId || `${product.productid}-${product.size}`;
              return <CartCard key={uniqueKey} product={product} />;
            })
          )}
        </div>
        {!isCartEmpty ? (
          <div className="container flex w-full justify-end ">
            <div className="flex flex-col w-full md:max-w-[450px] gap-2   items-between py-5 ">
              <div className="flex">
                <div className="flex items-center gap-2">
                  <h2 className="text-gray-500 text-2xl font-medium">CART </h2>
                  <h2 className=" text-2xl font-medium">TOTAL</h2>
                  <hr className="text-gray-500 bg-gray-500 w-8 h-[2px] bg-gray-500 " />
                </div>
              </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {cartTotal}
                  {currency}
                </span>
              </div>
              <hr className="text-gray-200" />
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>
                  {cartShippingFee}
                  {currency}
                </span>
              </div>
              <hr className="text-gray-200" />
              <div className="flex justify-between">
                <span>Total</span>
                <span>
                  {cartTotal + cartShippingFee}
                  {currency}
                </span>
              </div>
              <Link to="/checkout">
                <button className="py-2 mt-3 max-w-60 px-5 bg-black text-white hover:bg-black/80 transition-colors duration-300">
                  PROCEED TO CHECKOUT
                </button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Cart;
