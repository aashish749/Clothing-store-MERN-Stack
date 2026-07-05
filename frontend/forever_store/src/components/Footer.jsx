import React from "react";
import { assets } from "../assets/frontend_assets/assets";

const Footer = () => {
  return (
    <section className="mt-15">
      <div className="container mx-auto ">
        <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 text-sm">
          {/* --- Left Column: Logo & Description --- */}
          <div>
            <img src={assets.logo} className="mb-5 w-32" alt="Forever Logo" />
            <p className="w-full md:w-2/3 text-gray-600 leading-6">
              We curate the finest products to bring style and quality to your
              doorstep. From fashion to essentials, every item is chosen with
              care to elevate your everyday experience.
            </p>
          </div>

          {/* --- Center Column: Company Links --- */}
          <div>
            <p className="text-xl font-medium mb-5">COMPANY</p>
            <ul className="flex flex-col gap-1 text-gray-600">
              <li className="cursor-pointer hover:text-black">
                <a href="/">Home</a>
              </li>
              <li className="cursor-pointer hover:text-black">
                <a href="/about">About us</a>
              </li>
              <li className="cursor-pointer hover:text-black">
                <a href="#">Delivery</a>
              </li>
              <li className="cursor-pointer hover:text-black">
                <a href="/contact">Contact us</a>
              </li>
            </ul>
          </div>

          {/* --- Right Column: Get In Touch --- */}
          <div>
            <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
            <ul className="flex flex-col gap-1 text-gray-600">
              <li>+351 920792858</li>
              <li className="cursor-pointer hover:text-black">
                contact@aashis.dev
              </li>
              <li className="cursor-pointer hover:text-black">
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* --- Copyright Bar --- */}
        <div>
          <hr className="border-gray-300" />
          <p className="py-5 text-sm text-center">
            Copyright 2025@ aashis.dev - All Right Reserved.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Footer;
