import React, { useContext, useState } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { ShopContext } from "../context";
const Hero = () => {
  const { siteSettings } = useContext(ShopContext);
  const [imageLoaded, setImageLoaded] = useState(false);
  const heroImage = siteSettings?.heroImage;
  const heroBadge = siteSettings?.heroBadge || "Our BestSellers";
  const heroTitle = siteSettings?.heroTitle || "Latest Arrivals";
  const heroSubtitle =
    siteSettings?.heroSubtitle ||
    "Fresh drops, best picks, and daily essentials.";
  const heroCtaLabel = siteSettings?.heroCtaLabel || "SHOP NOW";
  const heroCtaNote = siteSettings?.heroCtaNote || "New season picks";

  return (
    <div className="section mb-15">
      <div className="container flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm md:flex-row">
        <div className="flex w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#f5f7fb] via-white to-[#eef2ff] py-12 md:w-1/2 md:py-16">
          <div className="flex items-center justify-center gap-3">
            <p className="h-[2px] w-9 bg-black"></p>
            <h3 className="text-medium text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
              {heroBadge}
            </h3>
          </div>
          <h1 className="px-6 text-center text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            {heroTitle}
          </h1>
          <p className="max-w-md px-6 text-center text-sm leading-6 text-slate-600 md:text-base">
            {heroSubtitle}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <h3 className="text-medium text-sm font-bold uppercase tracking-[0.24em] text-slate-900">
              <a
                href="/collection"
                className="hover:bg-slate-900 hover:text-white   px-4 py-2 transition-colors duration-300"
              >
                {heroCtaLabel}
              </a>
            </h3>
            <p className="h-[1px] w-9 bg-black"></p>
          </div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            {heroCtaNote}
          </p>
        </div>
        <div className="w-full md:w-1/2 flex relative">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 min-h-[280px] lg:min-h-[450px] bg-gray-200 animate-pulse" />
          )}
          <img
            src={heroImage}
            alt={heroTitle}
            onLoad={() => setImageLoaded(true)}
            className={`min-h-[280px] lg:min-h-[450px] h-full w-full object-cover object-center transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
