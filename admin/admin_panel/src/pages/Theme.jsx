import React, { useEffect, useState } from "react";
import { FiImage, FiUploadCloud } from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";

const Theme = () => {
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroBadge, setHeroBadge] = useState("");
  const [heroCtaLabel, setHeroCtaLabel] = useState("");
  const [heroCtaNote, setHeroCtaNote] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/site-settings/admin", {
        headers: getAdminAuthHeaders(),
      });
      const settings = data.settings || {};
      setHeroTitle(settings.heroTitle || "");
      setHeroSubtitle(settings.heroSubtitle || "");
      setHeroBadge(settings.heroBadge || "");
      setHeroCtaLabel(settings.heroCtaLabel || "");
      setHeroCtaNote(settings.heroCtaNote || "");
      setBannerTitle(settings.bannerTitle || "");
      setBannerSubtitle(settings.bannerSubtitle || "");
      setHeroImage(settings.heroImage || "");
      setBannerImage(settings.bannerImage || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load theme");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const uploadHero = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await adminApi.post(
        "/api/site-settings/admin/hero-image",
        formData,
        {
          headers: {
            ...getAdminAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setHeroImage(data.imageUrl || "");
      toast.success("Hero image uploaded");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await adminApi.put(
        "/api/site-settings/admin",
        {
          heroTitle,
          heroSubtitle,
          heroBadge,
          heroCtaLabel,
          heroCtaNote,
          heroImage,
          bannerTitle,
          bannerSubtitle,
          bannerImage,
        },
        {
          headers: getAdminAuthHeaders(),
        },
      );
      toast.success("Theme saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Theme
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Homepage banner
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Change the hero image, banner copy, and other storefront text.
        </p>
      </section>

      <form
        onSubmit={handleSave}
        className="grid gap-6 xl:grid-cols-[1fr_420px]"
      >
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <FiImage />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Hero
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Content controls
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Hero title
              </span>
              <input
                value={heroTitle}
                onChange={(event) => setHeroTitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Hero subtitle
              </span>
              <textarea
                rows="3"
                value={heroSubtitle}
                onChange={(event) => setHeroSubtitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Badge</span>
              <input
                value={heroBadge}
                onChange={(event) => setHeroBadge(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                CTA label
              </span>
              <input
                value={heroCtaLabel}
                onChange={(event) => setHeroCtaLabel(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                CTA note
              </span>
              <input
                value={heroCtaNote}
                onChange={(event) => setHeroCtaNote(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>

            <div className="sm:col-span-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Hero image
                  </p>
                  <p className="text-sm text-slate-500">
                    Upload a new hero image or paste a direct image URL below.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
                  <FiUploadCloud />
                  {uploading ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => uploadHero(event.target.files?.[0])}
                  />
                </label>
              </div>
              <input
                value={heroImage}
                onChange={(event) => setHeroImage(event.target.value)}
                placeholder="https://..."
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
              />
            </div>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Banner title
              </span>
              <input
                value={bannerTitle}
                onChange={(event) => setBannerTitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Banner subtitle
              </span>
              <textarea
                rows="3"
                value={bannerSubtitle}
                onChange={(event) => setBannerSubtitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Banner image URL
              </span>
              <input
                value={bannerImage}
                onChange={(event) => setBannerImage(event.target.value)}
                placeholder="Optional image URL"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save theme"}
            </button>
            <button
              type="button"
              onClick={loadSettings}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Reload
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Preview
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Homepage hero
          </h3>
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            {heroImage ? (
              <img
                src={heroImage}
                alt="Hero preview"
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center bg-slate-100 text-slate-400">
                No hero image
              </div>
            )}
            <div className="space-y-3 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                {heroBadge || "Badge"}
              </p>
              <h4 className="text-2xl font-semibold text-slate-900">
                {heroTitle || "Hero title"}
              </h4>
              <p className="text-sm leading-6 text-slate-600">
                {heroSubtitle || "Hero subtitle"}
              </p>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default Theme;
