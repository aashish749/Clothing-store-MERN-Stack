import React from "react";
import { useState } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { NavLink } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ShopContext } from "../context";
const Navbar = () => {
  const [hamBurger, setHamburger] = useState(false);
  const navigate = useNavigate();
  const { cartCount, setCartCount } = useContext(ShopContext);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCartCount(0);
    navigate("/login");
  };

  const handleProfileIconClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  };

  return (
    <div className="section sticky top-0 z-50 mb-0 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="container flex  py-3  justify-between">
        <div className="logo">
          <img src={assets.logo} className="h-8.5 " />
        </div>
        <div className="flex gap-3 hidden md:flex">
          <div className="flex justify-center items-center ">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `group flex flex-col items-center font-medium transition-colors duration-200 ${isActive ? "text-black" : "text-gray-700 hover:text-black"}`
              }
            >
              {({ isActive }) => (
                <>
                  <p>HOME</p>
                  <p
                    className={`h-[1.5px] bg-black transition-all duration-200 ${isActive ? "w-6" : "w-0 group-hover:w-6"}`}
                  ></p>
                </>
              )}
            </NavLink>
          </div>
          <div className="flex justify-center items-center ">
            <NavLink
              to="/collection"
              className={({ isActive }) =>
                `group flex flex-col items-center font-medium transition-colors duration-200 ${isActive ? "text-black" : "text-gray-700 hover:text-black"}`
              }
            >
              {({ isActive }) => (
                <>
                  <p>COLLECTION</p>
                  <p
                    className={`h-[1.5px] bg-black transition-all duration-200 ${isActive ? "w-6" : "w-0 group-hover:w-6"}`}
                  ></p>
                </>
              )}
            </NavLink>
          </div>
          <div className="flex justify-center items-center ">
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `group flex flex-col items-center font-medium transition-colors duration-200 ${isActive ? "text-black" : "text-gray-700 hover:text-black"}`
              }
            >
              {({ isActive }) => (
                <>
                  <p>ABOUT</p>
                  <p
                    className={`h-[1.5px] bg-black transition-all duration-200 ${isActive ? "w-6" : "w-0 group-hover:w-6"}`}
                  ></p>
                </>
              )}
            </NavLink>
          </div>
          <div className="flex justify-center items-center ">
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `group flex flex-col items-center font-medium transition-colors duration-200 ${isActive ? "text-black" : "text-gray-700 hover:text-black"}`
              }
            >
              {({ isActive }) => (
                <>
                  <p>CONTACT</p>
                  <p
                    className={`h-[1.5px] bg-black transition-all duration-200 ${isActive ? "w-6" : "w-0 group-hover:w-6"}`}
                  ></p>
                </>
              )}
            </NavLink>
          </div>
        </div>
        {/* right nav */}
        <div className="flex gap-1">
          <button
            className="w-9 h-9 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            onClick={() =>
              navigate("/collection", { state: { openSearch: true } })
            }
            type="button"
          >
            <img src={assets.search_icon} alt="" />
          </button>
          <div className="group relative flex justify-center items-center">
            <button
              type="button"
              onClick={handleProfileIconClick}
              className="w-9 h-9 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <img
                className="w-5 h-auto cursor-pointer"
                src={assets.profile_icon}
                alt=""
              />
            </button>

            {isLoggedIn ? (
              <div className="group-hover:block hidden absolute dropdown-menu top-8 right-0 pt-4 z-20">
                <div className="flex flex-col gap-3 w-44 py-4 px-5 bg-slate-100 text-gray-500 rounded-lg shadow-sm">
                  <Link to="/profile">
                    <p className="cursor-pointer hover:text-black">
                      My Profile
                    </p>
                  </Link>
                  <Link to="/orders">
                    <p className="cursor-pointer hover:text-black">Orders</p>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-left cursor-pointer hover:text-black"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <Link to="/cart">
            <button className="w-9 h-9  p-2 relative rounded-full hover:bg-gray-100 transition-colors duration-200">
              <img src={assets.cart_icon} alt="" />
              <span className="absolute bottom-0 right-0 bg-black text-white h-4 w-4 rounded-full flex items-center justify-center text-[12px]">
                {cartCount}
              </span>
            </button>
          </Link>

          <button className="w-9 h-9  p-2 relative md:hidden">
            <img
              src={assets.menu_icon}
              alt=""
              onClick={() => {
                setHamburger(!hamBurger);
              }}
            />
          </button>
        </div>
      </div>
      {/* mobile menu */}

      <div
        className={`flex flex-col  md:hidden z-40  h-screen absolute right-0 top-0 bg-white  overflow-hidden transition-all duration-300 ${hamBurger ? "w-screen" : "w-0"} `}
      >
        <div className="flex justify-center items-center ">
          <NavLink
            className={
              "flex flex-col px-3 items-start font-medium hover:text-bold  w-full py-2.5 border-b-[1px] border-gray-300 "
            }
          >
            <div
              className="flex justify-center items-center gap-3"
              onClick={() => {
                setHamburger(!hamBurger);
              }}
            >
              <img
                src={assets.dropdown_icon}
                alt=""
                className="rotate-180 h-5 block"
              />
              <p>Back</p>
            </div>
          </NavLink>
        </div>
        <div className="flex justify-center items-center ">
          <NavLink
            to="/"
            onClick={() => {
              setHamburger(!hamBurger);
            }}
            className={
              "flex flex-col items-start px-6 font-medium hover:text-bold mobile w-full py-2.5 border-b-[1px] border-gray-300 "
            }
          >
            <p>HOME</p>
          </NavLink>
        </div>
        <div className="flex justify-center items-center ">
          <NavLink
            to="/collection"
            onClick={() => {
              setHamburger(!hamBurger);
            }}
            className={
              "flex flex-col items-start px-6 font-medium hover:text-bold mobile w-full py-2.5 border-b-[1px] border-gray-300"
            }
          >
            <p>COLLECTION</p>
          </NavLink>
        </div>
        <div className="flex justify-center items-center ">
          <NavLink
            to="/about"
            onClick={() => {
              setHamburger(!hamBurger);
            }}
            className={
              "flex flex-col items-start px-6 font-medium hover:text-bold mobile w-full py-2.5 border-b-[1px] border-gray-300"
            }
          >
            <p>ABOUT</p>
          </NavLink>
        </div>
        <div className="flex justify-center items-center ">
          <NavLink
            to="/contact"
            onClick={() => {
              setHamburger(!hamBurger);
            }}
            className={
              "flex flex-col items-start px-6  font-medium hover:text-bold mobile w-full py-2.5 border-b-[1px] border-gray-300"
            }
          >
            <p>CONTACT</p>
          </NavLink>
        </div>
        <div className="flex justify-center items-center ">
          <NavLink
            to={isLoggedIn ? "/orders" : "/login"}
            onClick={() => {
              setHamburger(!hamBurger);
            }}
            className={
              "flex flex-col items-start px-6 font-medium hover:text-bold mobile w-full py-2.5 border-b-[1px] border-gray-300"
            }
          >
            <p>ORDERS</p>
          </NavLink>
        </div>
        <div className="flex justify-center items-center ">
          <NavLink
            to={isLoggedIn ? "/profile" : "/login"}
            onClick={() => {
              setHamburger(!hamBurger);
            }}
            className={
              "flex flex-col items-start px-6 font-medium hover:text-bold mobile w-full py-2.5 border-b-[1px] border-gray-300"
            }
          >
            <p>PROFILE</p>
          </NavLink>
        </div>
      </div>
      {/* <hr className="w-9/10  mx-auto bg-gray-300 text-gray-300" /> */}
    </div>
  );
};

export default Navbar;
