"use client";

import React, { useState, useEffect } from "react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import AppDropdown from "@/components/AppDropdown";
import apiInstance from "@/lib/api-instance";
import { toast } from "sonner";
import AppLoader from "@/components/AppLoader";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import DashboardBrandShowcase, {
  type BrandAdItem,
  DEFAULT_INSPIRATIONAL_ITEMS,
} from "@/components/dashboard/DashboardBrandShowcase";
import PaperHeaderSponsor from "@/components/exam/PaperHeaderSponsor";
import StarSVG from "@/public/svgs/StarSVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import ScrollSVG from "@/public/svgs/ScrollSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import EyeOffSVG from "@/public/svgs/EyeOffSVG";
import EditSVG from "@/public/svgs/EditSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AddSVG from "@/public/svgs/AddSVG";
import FileDuotoneSVG from "@/public/svgs/FileDuotoneSVG";
import ZapSVG from "@/public/svgs/ZapSVG";
import ImageSVG from "@/public/svgs/ImageSVG";
import GallerySVG from "@/public/svgs/GallerySVG";
import DashboardSVG from "@/public/svgs/DashboardSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import SettingsSVG from "@/public/svgs/SettingsSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import PlaySVG from "@/public/svgs/PlaySVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import { cn } from "@/lib/utils";
import { ExternalLink, Check, Copy, Loader2, X, Search, Sparkles } from "lucide-react";

interface Advertisement {
  id: string;
  brand_name: string;
  tagline: string | null;
  image_url: string;
  target_url: string | null;
  placement: string;
  is_active: boolean;
  display_order: number;
  impressions: number;
  clicks: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AdStats {
  totalAds: number;
  activeAds: number;
  totalImpressions: number;
  totalClicks: number;
}

interface ShowcaseSettings {
  slideInterval: number;
  autoPlay: boolean;
  pauseOnHover: boolean;
  spiritualFallback: boolean;
}

const PLACEMENT_OPTIONS = [
  { value: "dashboard_showcase", label: "Dashboard Hero Showcase", icon: DashboardSVG, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { value: "paper_1", label: "Past Papers 1 (Objective MCQs)", icon: P1SVG, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { value: "paper_2", label: "Past Papers 2 (Subjective Theory)", icon: P2SVG, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { value: "all_papers", label: "All Past Papers (Paper 1 & Paper 2)", icon: SubjectsSVG, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  { value: "all", label: "Global — All Portals & Pages", icon: CrownSVG, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
] as const;

const DURATION_PRESETS = [
  { label: "5s (Fast)", value: 5 },
  { label: "8s (Balanced)", value: 8 },
  { label: "10s (Recommended)", value: 10 },
  { label: "12s (Relaxed)", value: 12 },
  { label: "15s (Slow)", value: 15 },
  { label: "20s (Extended)", value: 20 },
];

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [stats, setStats] = useState<AdStats>({
    totalAds: 0,
    activeAds: 0,
    totalImpressions: 0,
    totalClicks: 0,
  });
  const [loading, setLoading] = useState(true);

  // Showcase Timing & Behavior Settings
  const [settings, setSettings] = useState<ShowcaseSettings>({
    slideInterval: 10,
    autoPlay: true,
    pauseOnHover: true,
    spiritualFallback: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);

  // Deletion state
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [placement, setPlacement] = useState("dashboard_showcase");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [imageBase64, setImageBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Filter, search and tabs
  const [activeTab, setActiveTab] = useState<"ads" | "settings" | "fallbacks" | "specs">("ads");
  const [placementFilter, setPlacementFilter] = useState<string>("all_filter");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewPlacement, setPreviewPlacement] = useState<"dashboard" | "paper_1" | "paper_2">("dashboard");

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const res = (await apiInstance.get("/admin/advertisements")) as {
        success: boolean;
        data: Advertisement[];
        stats: AdStats;
        settings?: ShowcaseSettings;
      };
      if (res.success) {
        setAds(res.data || []);
        if (res.stats) setStats(res.stats);
        if (res.settings) {
          setSettings(res.settings);
        }
      }
    } catch (error) {
      console.error("Failed to load advertisements", error);
      toast.error("Failed to load advertisements");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      const res = (await apiInstance.put("/admin/advertisements", settings)) as {
        success: boolean;
        message?: string;
        settings?: ShowcaseSettings;
      };
      if (res.success) {
        toast.success("Showcase timing & settings saved successfully!");
        if (res.settings) setSettings(res.settings);
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error("Failed to save showcase settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setSelectedAd(null);
    setBrandName("");
    setTagline("");
    setImageUrl("");
    setImageBase64("");
    setTargetUrl("");
    setPlacement("dashboard_showcase");
    setDisplayOrder(ads.length);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad: Advertisement) => {
    setModalMode("edit");
    setSelectedAd(ad);
    setBrandName(ad.brand_name);
    setTagline(ad.tagline || "");
    setImageUrl(ad.image_url);
    setImageBase64("");
    setTargetUrl(ad.target_url || "");
    setPlacement(ad.placement || "dashboard_showcase");
    setDisplayOrder(ad.display_order ?? 0);
    setIsActive(ad.is_active);
    setIsModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("File size must be under 8MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const updatedStatus = !ad.is_active;
      await apiInstance.put(`/admin/advertisements/${ad.id}`, {
        is_active: updatedStatus,
      });
      toast.success(
        updatedStatus
          ? `Advertisement "${ad.brand_name}" is now live!`
          : `Advertisement "${ad.brand_name}" paused.`
      );
      fetchAdvertisements();
    } catch (error) {
      toast.error("Failed to toggle advertisement status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let finalImageUrl = imageUrl;

    try {
      if (imageBase64 && imageBase64.startsWith("data:image")) {
        const uploadToast = toast.loading("Uploading ad banner to Cloudinary...");
        try {
          const uploadRes = (await apiInstance.post("/upload/cloudinary", {
            image: imageBase64,
            folder: "zentix/advertisements",
          })) as { success: boolean; url: string };

          toast.dismiss(uploadToast);
          if (uploadRes.success && uploadRes.url) {
            finalImageUrl = uploadRes.url;
          } else {
            toast.error("Image upload failed");
            setIsSubmitting(false);
            return;
          }
        } catch (uploadErr) {
          toast.dismiss(uploadToast);
          toast.error("Failed to upload image to cloud storage");
          setIsSubmitting(false);
          return;
        }
      }

      if (!finalImageUrl) {
        toast.error("Please provide an image URL or upload a banner");
        setIsSubmitting(false);
        return;
      }

      if (modalMode === "add") {
        await apiInstance.post("/admin/advertisements", {
          brand_name: brandName,
          tagline,
          image_url: finalImageUrl,
          target_url: targetUrl || null,
          placement,
          display_order: Number(displayOrder) || 0,
          is_active: isActive,
        });
        toast.success("Brand advertisement created successfully!");
      } else if (modalMode === "edit" && selectedAd) {
        await apiInstance.put(`/admin/advertisements/${selectedAd.id}`, {
          brand_name: brandName,
          tagline,
          image_url: finalImageUrl,
          target_url: targetUrl || null,
          placement,
          display_order: Number(displayOrder) || 0,
          is_active: isActive,
        });
        toast.success("Brand advertisement updated successfully!");
      }

      setIsModalOpen(false);
      fetchAdvertisements();
    } catch (error: any) {
      toast.error(error?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!adToDelete) return;
    setIsDeleting(true);
    try {
      await apiInstance.delete(`/admin/advertisements/${adToDelete.id}`);
      toast.success("Advertisement deleted successfully!");
      setAdToDelete(null);
      fetchAdvertisements();
    } catch (error) {
      toast.error("Failed to delete advertisement");
    } finally {
      setIsDeleting(false);
    }
  };

  const brandSpecGuide = `================================================
EXBOARD AI — BRAND BANNER SPECIFICATIONS
================================================
1. Recommended Banner Resolution:
   • Dashboard Hero Slot: 1200 × 400 px (3:1 Aspect Ratio)
   • Past Paper 1 & 2 Header: 400 × 120 px or Transparent Logo PNG
   • High-DPI / Retina: 1800 × 600 px (3:1 Aspect Ratio)

2. Safe Content Area:
   • Keep logos, texts, slogans & CTAs within the central 80% (960 × 320 px)
   • Avoid placing critical text along outer edges so it renders cleanly across all mobile & desktop screen sizes.

3. File Format & Weight:
   • Formats: PNG (transparent or solid), WebP, or JPG
   • Maximum File Size: Under 8 MB (automatic Cloudinary optimization)
   • Color Profile: sRGB

4. Placements Available:
   • Dashboard Hero Showcase (Student & Teacher Dashboards)
   • Past Papers 1 (Objective MCQs Exam Header)
   • Past Papers 2 (Subjective Theory Exam Header)
   • All Past Papers (Global Exam Partner)
   • All Portals & Pages
================================================`;

  const handleCopySpecs = () => {
    navigator.clipboard.writeText(brandSpecGuide);
    setIsCopied(true);
    toast.success("Brand Specifications copied to clipboard!");
    setTimeout(() => setIsCopied(false), 3000);
  };

  const filteredAds = ads.filter((ad) => {
    // Placement filter
    if (placementFilter !== "all_filter" && ad.placement !== placementFilter) {
      return false;
    }
    // Status filter
    if (statusFilter === "active" && !ad.is_active) return false;
    if (statusFilter === "inactive" && ad.is_active) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchBrand = ad.brand_name?.toLowerCase().includes(q);
      const matchTagline = ad.tagline?.toLowerCase().includes(q);
      const matchPlacement = ad.placement?.toLowerCase().includes(q);
      if (!matchBrand && !matchTagline && !matchPlacement) return false;
    }
    return true;
  });

  const activeAdsList: BrandAdItem[] = ads
    .filter((a) => a.is_active)
    .map((a) => ({
      id: a.id,
      brand_name: a.brand_name,
      tagline: a.tagline,
      image_url: a.image_url,
      target_url: a.target_url,
      placement: a.placement,
      display_order: a.display_order,
    }));

  const getPlacementInfo = (val: string) => {
    const found = PLACEMENT_OPTIONS.find((p) => p.value === val);
    return (
      found || {
        value: val,
        label: val || "Dashboard Showcase",
        icon: StarSVG,
        color: "text-muted-foreground bg-muted border-border/50",
      }
    );
  };

  return (
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title="Brand Advertisements & Showcase"
        description="Manage sponsor banners, exam header partner logos, slide rotation timing, and Quranic verses."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AppButton
              variant="outline"
              onClick={() => setActiveTab("settings")}
              className={cn(
                "h-10 rounded-xl px-3.5 text-xs font-bold transition-all",
                activeTab === "settings"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 hover:bg-muted"
              )}
            >
              <SettingsSVG className="mr-1.5 size-4 text-primary" />
              <span>Showcase Settings</span>
            </AppButton>

            <AppButton
              variant="outline"
              onClick={handleCopySpecs}
              className="h-10 rounded-xl border-border/60 px-3.5 text-xs font-bold"
            >
              {isCopied ? (
                <Check className="mr-1.5 size-4 text-emerald-500" />
              ) : (
                <FileDuotoneSVG className="mr-1.5 size-4 text-muted-foreground" />
              )}
              <span>{isCopied ? "Specs Copied" : "Copy Specs"}</span>
            </AppButton>

            <AppButton
              onClick={handleOpenAdd}
              className="h-10 rounded-xl px-4 text-xs font-bold shadow-md shadow-primary/20"
            >
              <AddSVG className="mr-1.5 size-4" />
              <span>New Advertisement</span>
            </AppButton>
          </div>
        }
      />

      {/* Sleek Compact KPI Stats Overview */}
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-3.5 shadow-xs transition-colors hover:border-primary/30">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Campaigns
            </p>
            <h4 className="mt-0.5 text-xl font-black text-foreground">
              {stats.totalAds}
            </h4>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DashboardSVG className="size-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-3.5 shadow-xs transition-colors hover:border-emerald-500/30">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Sponsors
            </p>
            <h4 className="mt-0.5 text-xl font-black text-emerald-500">
              {stats.activeAds}
            </h4>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <CrownSVG className="size-5 text-emerald-500" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-3.5 shadow-xs transition-colors hover:border-blue-500/30">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Impressions
            </p>
            <h4 className="mt-0.5 text-xl font-black text-blue-500">
              {stats.totalImpressions.toLocaleString()}
            </h4>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <EyeSVG className="size-5 text-blue-500" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-3.5 shadow-xs transition-colors hover:border-amber-500/30">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Clicks (CTR)
            </p>
            <h4 className="mt-0.5 text-xl font-black text-amber-500">
              {stats.totalClicks.toLocaleString()}{" "}
              <span className="text-[11px] font-semibold text-muted-foreground">
                (
                {stats.totalImpressions > 0
                  ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(1)
                  : "0.0"}
                %)
              </span>
            </h4>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <ZapSVG className="size-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("ads")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "ads"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <CrownSVG className="size-4" />
            <span>Campaigns & Ads ({ads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "settings"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <SettingsSVG className="size-4" />
            <span>Showcase & Timing Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fallbacks")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "fallbacks"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <BookOpenSVG className="size-4" />
            <span>Default Verses ({DEFAULT_INSPIRATIONAL_ITEMS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "specs"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <ScrollSVG className="size-4" />
            <span>Guidelines & Specs</span>
          </button>
        </div>

        {/* Quick Preview Toggle button in top bar */}
        {activeTab === "ads" && (
          <AppButton
            variant="outline"
            onClick={() => setShowLivePreview((prev) => !prev)}
            className="h-9 rounded-xl border-border/60 px-3 text-xs font-bold"
          >
            {showLivePreview ? (
              <EyeOffSVG className="mr-1.5 size-3.5 text-muted-foreground" />
            ) : (
              <EyeSVG className="mr-1.5 size-3.5 text-primary" />
            )}
            <span>{showLivePreview ? "Hide Live Preview" : "Preview Live Showcase"}</span>
          </AppButton>
        )}
      </div>

      {/* TAB 1: CAMPAIGNS & ADS MANAGEMENT */}
      {activeTab === "ads" && (
        <div className="space-y-6">
          {/* Collapsible Interactive Live Preview */}
          {showLivePreview && (
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-6 animate-in fade-in duration-200">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <EyeSVG className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Live Placement Preview
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {previewPlacement === "dashboard" && "Student Dashboard Hero Showcase slot (Auto-rotates every " + settings.slideInterval + "s)."}
                      {previewPlacement === "paper_1" && "Past Papers 1 (Objective MCQs) timer header banner."}
                      {previewPlacement === "paper_2" && "Past Papers 2 (Subjective Theory) timer header banner."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-xl border border-border/60 bg-card p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewPlacement("dashboard")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                        previewPlacement === "dashboard"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <DashboardSVG className="size-3.5" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewPlacement("paper_1")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                        previewPlacement === "paper_1"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <P1SVG className="size-3.5" />
                      <span>Paper 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewPlacement("paper_2")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                        previewPlacement === "paper_2"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <P2SVG className="size-3.5" />
                      <span>Paper 2</span>
                    </button>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold",
                      activeAdsList.length > 0
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    <span className="size-2 animate-pulse rounded-full bg-current" />
                    <span>
                      {activeAdsList.length > 0
                        ? `${activeAdsList.length} Campaign(s) Live`
                        : "Spiritual Mode Active"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Rendered Live Component */}
              <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
                {previewPlacement === "dashboard" ? (
                  <DashboardBrandShowcase
                    customAds={activeAdsList.length > 0 ? activeAdsList : undefined}
                    slideInterval={settings.slideInterval}
                    autoPlay={settings.autoPlay}
                    pauseOnHover={settings.pauseOnHover}
                    spiritualFallback={settings.spiritualFallback}
                  />
                ) : previewPlacement === "paper_1" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        <P1SVG className="size-5 text-blue-500" />
                        <span className="text-xs font-bold text-foreground">
                          Paper 1 Assessment Header Partner Slot
                        </span>
                      </div>
                      <PaperHeaderSponsor placement="paper_1" variant="badge" />
                    </div>
                    <PaperHeaderSponsor placement="paper_1" variant="banner" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        <P2SVG className="size-5 text-purple-500" />
                        <span className="text-xs font-bold text-foreground">
                          Paper 2 Assessment Header Partner Slot
                        </span>
                      </div>
                      <PaperHeaderSponsor placement="paper_2" variant="badge" />
                    </div>
                    <PaperHeaderSponsor placement="paper_2" variant="banner" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border/60 bg-background pl-8 pr-3 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="inline-flex rounded-xl border border-border/60 bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                    statusFilter === "all"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All ({ads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                    statusFilter === "active"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Active ({stats.activeAds})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                    statusFilter === "inactive"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Paused ({stats.totalAds - stats.activeAds})
                </button>
              </div>
            </div>

            {/* Slot Dropdown Filter using AppDropdown */}
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-bold text-muted-foreground">Filter Slot:</span>
              <div className="w-56">
                <AppDropdown
                  value={placementFilter}
                  onChange={(e) => setPlacementFilter(e.target.value)}
                  options={[
                    { label: `All Placements (${ads.length})`, value: "all_filter" },
                    { label: "Dashboard Showcase", value: "dashboard_showcase" },
                    { label: "Paper 1 (MCQs)", value: "paper_1" },
                    { label: "Paper 2 (Theory)", value: "paper_2" },
                    { label: "All Past Papers", value: "all_papers" },
                    { label: "Global Portals", value: "all" },
                  ]}
                  className="h-9 rounded-xl border-border/60 bg-background px-3 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <AppLoader />
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-card/60 p-12 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CrownSVG className="size-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                No Advertisements Found
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                {searchQuery || placementFilter !== "all_filter" || statusFilter !== "all"
                  ? "No campaigns match your current filters. Try resetting the search or placement filter."
                  : "Upload sponsor banners, Paper 1 & 2 partner logos, or promotional links."}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                {(searchQuery || placementFilter !== "all_filter" || statusFilter !== "all") && (
                  <AppButton
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setPlacementFilter("all_filter");
                      setStatusFilter("all");
                    }}
                    className="rounded-xl px-4 text-xs font-bold"
                  >
                    Reset Filters
                  </AppButton>
                )}
                <AppButton
                  onClick={handleOpenAdd}
                  className="rounded-xl px-5 text-xs font-bold"
                >
                  <AddSVG className="mr-1.5 size-4" />
                  <span>Create First Banner</span>
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredAds.map((ad) => {
                const placementMeta = getPlacementInfo(ad.placement);
                const PlacementIcon = placementMeta.icon;
                const ctrPercent =
                  ad.impressions > 0
                    ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={ad.id}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card p-4.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md",
                      ad.is_active
                        ? "border-border/60"
                        : "border-border/30 opacity-75 grayscale-[0.2]"
                    )}
                  >
                    <div>
                      {/* Top Header: Placement Badge & Actions */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10.5px] font-bold",
                            placementMeta.color
                          )}
                        >
                          <PlacementIcon className="size-3.5 shrink-0" />
                          <span>{placementMeta.label}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ad)}
                            className="flex size-7.5 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition hover:bg-primary/10 hover:text-primary cursor-pointer"
                            title="Edit Ad"
                          >
                            <EditSVG className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setAdToDelete(ad)}
                            className="flex size-7.5 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition hover:bg-red-500/20 cursor-pointer"
                            title="Delete Ad"
                          >
                            <DeleteSVG className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Image Thumbnail Preview */}
                      <div className="relative mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background/50">
                        <img
                          src={ad.image_url}
                          alt={ad.brand_name}
                          className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/1200x400/0f241a/ffffff?text=Image+Unavailable";
                          }}
                        />

                        <div className="absolute right-2.5 top-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(ad)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold backdrop-blur-md transition-all cursor-pointer",
                              ad.is_active
                                ? "bg-emerald-500/90 text-white shadow-xs"
                                : "bg-zinc-800/80 text-zinc-300"
                            )}
                            title={ad.is_active ? "Click to Pause" : "Click to Activate"}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                ad.is_active ? "bg-white animate-pulse" : "bg-zinc-400"
                              )}
                            />
                            <span>{ad.is_active ? "Live" : "Paused"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Brand Info */}
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {ad.brand_name}
                        </h4>
                        {ad.tagline && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground font-medium">
                            "{ad.tagline}"
                          </p>
                        )}
                        {ad.target_url && (
                          <a
                            href={ad.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            <span className="truncate max-w-[200px]">
                              {ad.target_url.replace(/^https?:\/\//, "")}
                            </span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Bottom Metrics Bar */}
                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px]">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-semibold text-muted-foreground">Views: </span>
                          <span className="font-bold text-foreground">
                            {ad.impressions.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground">Clicks: </span>
                          <span className="font-bold text-amber-500">
                            {ad.clicks.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-0.5 font-bold text-primary text-[10.5px]">
                        <ZapSVG className="size-3 text-primary" />
                        <span>CTR {ctrPercent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHOWCASE & TIMING SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <SettingsSVG className="size-5.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Showcase & Slide Rotation Settings
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure display duration per slide, auto-play rotation, hover pause, and spiritual mode fallbacks.
                  </p>
                </div>
              </div>

              <AppButton
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="rounded-xl px-5 text-xs font-bold shadow-md shadow-primary/20"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 size-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </AppButton>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column: Timing Controls */}
              <div className="space-y-5">
                {/* Slide Duration Controller */}
                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4.5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockSVG className="size-4 text-primary" />
                      <label className="text-xs font-bold text-foreground">
                        Slide Stay Duration (Seconds per card)
                      </label>
                    </div>
                    <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">
                      {settings.slideInterval}s
                    </span>
                  </div>

                  <p className="mb-3 text-[11px] text-muted-foreground">
                    How many seconds each Quranic Ayat or Brand Advertisement stays visible before rotating to the next card.
                  </p>

                  {/* Preset Duration Buttons */}
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            slideInterval: preset.value,
                          }))
                        }
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer",
                          settings.slideInterval === preset.value
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border-border/60 bg-background text-foreground hover:border-primary/40 text-xs font-medium"
                        )}
                      >
                        <span className="text-xs font-bold">{preset.value}s</span>
                        <span className="text-[10px] opacity-80">{preset.label.split(" ")[1] || ""}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom seconds slider / number input */}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">Custom duration:</span>
                    <input
                      type="range"
                      min={3}
                      max={60}
                      step={1}
                      value={settings.slideInterval}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          slideInterval: Number(e.target.value),
                        }))
                      }
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={3}
                        max={60}
                        value={settings.slideInterval}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            slideInterval: Math.max(3, Math.min(60, Number(e.target.value) || 10)),
                          }))
                        }
                        className="h-8 w-14 rounded-lg border border-border/60 bg-background text-center text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs font-bold text-muted-foreground">sec</span>
                    </div>
                  </div>
                </div>

                {/* Behavioral Toggles */}
                <div className="space-y-3">
                  {/* Auto-Play Toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                        <PlaySVG className="size-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Auto-Play Rotation</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Automatically cycle through cards without requiring student interaction.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.autoPlay}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, autoPlay: e.target.checked }))
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']" />
                    </label>
                  </div>

                  {/* Pause on Hover Toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                        <ClockSVG className="size-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Pause on Hover / Touch</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Freeze carousel timer when student hovers to read the verse or brand details.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.pauseOnHover}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, pauseOnHover: e.target.checked }))
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']" />
                    </label>
                  </div>

                  {/* Spiritual Fallback Mode */}
                  <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                        <BookOpenSVG className="size-4.5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          Spiritual Mode (Quranic Verses Fallback)
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Display uplifting Ayat when no commercial ads are active in a slot.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.spiritualFallback}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            spiritualFallback: e.target.checked,
                          }))
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Tester */}
              <div className="flex flex-col justify-between rounded-2xl border border-border/50 bg-muted/20 p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EyeSVG className="size-4 text-primary" />
                      <h4 className="text-xs font-bold text-foreground">
                        Live Speed & Timing Simulation
                      </h4>
                    </div>
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                      Simulating {settings.slideInterval}s Interval
                    </span>
                  </div>

                  <p className="mb-4 text-xs text-muted-foreground">
                    This preview automatically uses your chosen {settings.slideInterval}s duration and hover settings in real-time.
                  </p>

                  <div className="rounded-2xl border border-border/40 bg-card p-3 shadow-xs">
                    <DashboardBrandShowcase
                      customAds={activeAdsList.length > 0 ? activeAdsList : undefined}
                      slideInterval={settings.slideInterval}
                      autoPlay={settings.autoPlay}
                      pauseOnHover={settings.pauseOnHover}
                      spiritualFallback={settings.spiritualFallback}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <span>Changes apply to all student & teacher dashboard showcases</span>
                  <AppButton
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="rounded-xl px-4 text-xs font-bold"
                  >
                    {isSavingSettings ? "Saving..." : "Save Settings"}
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEFAULT QURANIC VERSES */}
      {activeTab === "fallbacks" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">About Spiritual Mode: </span>
            These 4 inspirational Quranic verses with centered Bismillah, Urdu translations, and Surah references automatically rotate on the student dashboard whenever no commercial sponsor banners are active.
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_INSPIRATIONAL_ITEMS.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "relative flex min-h-52 flex-col justify-between overflow-hidden rounded-3xl border p-4.5 text-white shadow-md select-none",
                  item.borderGlow
                )}
              >
                {/* Gradient background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className={cn("absolute inset-0 bg-linear-to-r", item.accentGradient)} />
                  <div className="absolute -top-[40%] -right-[15%] size-[70%] rounded-full bg-white/20 blur-[35px]" />
                  <div className="absolute -bottom-[40%] -left-[15%] size-[60%] rounded-full bg-black/40 blur-[30px]" />
                </div>

                <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center space-y-0.5 sm:space-y-1 text-center py-0.5">
                  {/* Bismillah Header */}
                  <p
                    dir="rtl"
                    className="w-full text-center !text-center font-urdu text-[10.5px] sm:text-[11.5px] lg:text-xs font-medium text-amber-200/95 drop-shadow-xs tracking-wide leading-snug antialiased"
                    style={{
                      fontFamily: "var(--font-urdu), 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                      textAlign: "center",
                    }}
                  >
                    بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                  </p>

                  {item.arabicText && (
                    <p
                      dir="rtl"
                      className="w-full text-center !text-center font-urdu text-[12.5px] sm:text-[13.5px] lg:text-[14.5px] font-normal leading-[1.7] sm:leading-[1.8] text-white drop-shadow-md px-2 antialiased"
                      style={{
                        fontFamily: "var(--font-urdu), 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                        textAlign: "center",
                      }}
                    >
                      {item.arabicText}
                    </p>
                  )}

                  {item.subtitle && (
                    <p
                      dir="rtl"
                      className="w-full text-center !text-center font-urdu text-[9.5px] sm:text-[10px] lg:text-[10.5px] font-bold leading-[1.45] sm:leading-[1.5] text-white/95 drop-shadow-xs px-1 antialiased"
                      style={{
                        fontFamily: "var(--font-urdu), 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                        textAlign: "center",
                      }}
                    >
                      {item.subtitle}
                    </p>
                  )}

                  {item.urduTranslation && (
                    <p
                      dir="rtl"
                      className="w-full text-center !text-center font-urdu text-[9.5px] sm:text-[10px] lg:text-[10.5px] font-medium leading-[1.55] sm:leading-[1.65] text-amber-100/95 drop-shadow-xs px-1 antialiased"
                      style={{
                        fontFamily: "var(--font-urdu), 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                        textAlign: "center",
                      }}
                    >
                      {item.urduTranslation}
                    </p>
                  )}
                </div>

                {/* Bottom Text */}
                {!item.hideFooterText && (
                  <div className="relative z-10 flex items-center justify-center pt-0.5 text-white/70">
                    <span className="text-[8px] sm:text-[8.5px] lg:text-[9px] font-bold uppercase tracking-wider drop-shadow-xs">
                      ExBoard AI Notice Board
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BRAND SPECS GUIDE */}
      {activeTab === "specs" && (
        <div className="space-y-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-border/50 pb-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                Brand Banner Asset Specifications
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Share these exact dimensions with sponsors (Dollar Stationery, Piano, Universities, Banks, etc.) to ensure banners fit seamlessly.
              </p>
            </div>

            <AppButton onClick={handleCopySpecs} className="shrink-0 rounded-xl px-4 text-xs font-bold">
              {isCopied ? <Check className="mr-1.5 size-4" /> : <FileDuotoneSVG className="mr-1.5 size-4" />}
              <span>{isCopied ? "Copied to Clipboard" : "Copy Guidelines Text"}</span>
            </AppButton>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 rounded-2xl border border-border/50 bg-muted/20 p-4">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                Dashboard Hero Slot
              </span>
              <h4 className="text-sm font-bold text-foreground">1200 × 400 px</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standard 3:1 aspect ratio. High-resolution WebP/PNG up to 8MB. Content centered with 10% safety margin.
              </p>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-border/50 bg-muted/20 p-4">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                Past Papers 1 & 2 Header
              </span>
              <h4 className="text-sm font-bold text-foreground">400 × 120 px / PNG Logo</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transparent PNG or crisp brand logo displayed in the exam timer header during paper solving.
              </p>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-border/50 bg-muted/20 p-4">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                Safe Margin & Format
              </span>
              <h4 className="text-sm font-bold text-foreground">80% Inner Safe Zone</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keep all logos, taglines, and CTAs within central 80% box to prevent clipping on mobile screens.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background p-4">
            <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
              {brandSpecGuide}
            </pre>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="mb-5 flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CrownSVG className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {modalMode === "add" ? "Create Brand Advertisement" : "Edit Advertisement"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure campaign details, target URL, and placement.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Brand Name & Tagline */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold text-muted-foreground">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-border/60 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="e.g. Dollar Stationery"
                  />
                </div>

                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold text-muted-foreground">
                    Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border/60 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                    placeholder='e.g. "Pointer to bas Dollar hai"'
                  />
                </div>
              </div>

              {/* Target URL & Placement */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold text-muted-foreground">
                    Target Click URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border/60 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="https://dollarstationery.com"
                  />
                </div>

                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold text-muted-foreground">
                    Placement Slot *
                  </label>
                  <AppDropdown
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    options={PLACEMENT_OPTIONS.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                    }))}
                    className="h-11 rounded-xl border-border/60 bg-background px-3.5 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Display Order & Active status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 ml-1 block text-xs font-bold text-muted-foreground">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-border/60 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-3">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    <span className="text-xs font-bold text-foreground">
                      Make Campaign Live Now
                    </span>
                  </label>
                </div>
              </div>

              {/* Banner Image Upload & Direct URL */}
              <div>
                <label className="mb-1 ml-1 block text-xs font-bold text-muted-foreground">
                  Banner / Logo Image (1200×400px or PNG Logo) *
                </label>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-20 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background">
                      {imageBase64 || imageUrl ? (
                        <img
                          src={imageBase64 || imageUrl}
                          alt="Preview"
                          className="size-full object-cover object-center"
                        />
                      ) : (
                        <ImageSVG className="size-6 text-muted-foreground/50" />
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 p-2 text-center transition-colors hover:bg-primary/5">
                        <GallerySVG className="mb-1 size-5 text-primary" />
                        <span className="text-xs font-bold text-primary">
                          {imageBase64 ? "Change Uploaded Image" : "Upload Brand Banner / Logo"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          PNG, WebP, JPG up to 8MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileChange}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste direct Cloudinary / Image URL here..."
                      className="h-10 w-full rounded-xl border border-border/60 bg-background px-3.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 rounded-xl px-5 text-xs font-bold"
                >
                  Cancel
                </AppButton>

                <AppButton
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 rounded-xl px-6 text-xs font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : modalMode === "add" ? (
                    "Publish Banner"
                  ) : (
                    "Update Banner"
                  )}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(adToDelete)}
        onClose={() => {
          if (!isDeleting) setAdToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Advertisement"
        message="Are you sure you want to delete this brand advertisement? This action cannot be undone."
        itemName={adToDelete?.brand_name}
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
