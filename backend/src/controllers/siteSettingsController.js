import SiteSetting from "../models/SiteSetting.js";

const getOrCreateSettings = async () => {
  let settings = await SiteSetting.findOne();
  if (!settings) {
    settings = await SiteSetting.create({});
  }
  return settings;
};

export const getPublicSiteSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getAdminSiteSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const updateSiteSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const {
      heroTitle,
      heroSubtitle,
      heroBadge,
      heroImage,
      heroCtaLabel,
      heroCtaNote,
      bannerTitle,
      bannerSubtitle,
      bannerImage,
    } = req.body;

    if (heroTitle !== undefined) settings.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle;
    if (heroBadge !== undefined) settings.heroBadge = heroBadge;
    if (heroImage !== undefined) settings.heroImage = heroImage;
    if (heroCtaLabel !== undefined) settings.heroCtaLabel = heroCtaLabel;
    if (heroCtaNote !== undefined) settings.heroCtaNote = heroCtaNote;
    if (bannerTitle !== undefined) settings.bannerTitle = bannerTitle;
    if (bannerSubtitle !== undefined) settings.bannerSubtitle = bannerSubtitle;
    if (bannerImage !== undefined) settings.bannerImage = bannerImage;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Site settings updated successfully",
      settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const uploadHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hero image uploaded successfully",
      imageUrl: req.file.path,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
