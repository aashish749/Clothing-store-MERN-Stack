import React from "react";
import { assets } from "../assets/frontend_assets/assets";
const OurPolicy = () => {
  return (
    <div className="flex flex-col gap-6  md:flex-row container justify-center items-center text-center  mt-10 mb-10">
      <div className="flex flex-col w-8/10 md:w-1/3 justify-center items-center px-4">
        <img src={assets.exchange_icon} className="w-14 mb-3" alt="" />
        <h4 className="font-semibold">Easy Exchange Policy</h4>
        <p className="text-gray-500">We offer hassle free exchange policy.</p>
      </div>
      <div className="flex flex-col w-8/10 md:w-1/3 justify-center items-center px-4">
        <img src={assets.quality_icon} className="w-14 mb-3" alt="" />
        <h4 className="font-semibold">7 Days Return Policy</h4>
        <p className="text-gray-500">We provide 7 days free return policy .</p>
      </div>
      <div className="flex flex-col w-8/10 md:w-1/3 justify-center items-center px-4">
        <img src={assets.support_img} className="w-12 mb-3" alt="" />
        <h4 className="font-semibold">Best customer support</h4>
        <p className="text-gray-500">we provide 24/7 customer support .</p>
      </div>
    </div>
  );
};

export default OurPolicy;
