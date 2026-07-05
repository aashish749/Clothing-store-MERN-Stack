import mongoose from "mongoose";

const siteSettingSchema = new mongoose.Schema(
  {
    heroTitle: { type: String, trim: true, default: "Latest Arrivals" },
    heroSubtitle: {
      type: String,
      trim: true,
      default: "Fresh drops, best picks, and daily essentials.",
    },
    heroBadge: { type: String, trim: true, default: "Our BestSellers" },
    heroImage: { type: String, trim: true, default: "" },
    heroCtaLabel: { type: String, trim: true, default: "Shop Now" },
    heroCtaNote: { type: String, trim: true, default: "New season picks" },
    bannerTitle: {
      type: String,
      trim: true,
      default: "Fresh banner, fresh mood",
    },
    bannerSubtitle: {
      type: String,
      trim: true,
      default: "Use the theme page to update the storefront look anytime.",
    },
    bannerImage: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

const SiteSetting = mongoose.model("SiteSetting", siteSettingSchema);

export default SiteSetting;
