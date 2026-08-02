import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for every business-specific value on the site.
 * Nothing here is hardcoded to a particular salon — all of it is editable
 * from the Admin Panel (Site Settings).
 */
export type SiteSettings = {
  id: number;

  /* --- general --- */
  business_name_ar: string;
  business_name_he: string;
  brand_latin: string | null;
  tagline_ar: string;
  tagline_he: string;
  logo_url: string | null;

  /* --- hero --- */
  hero_title_ar: string;
  hero_title_he: string;
  hero_subtitle_ar: string;
  hero_subtitle_he: string;
  hero_image_url: string | null;

  /* --- about --- */
  about_title_ar: string;
  about_title_he: string;
  about_text_ar: string;
  about_text_he: string;

  /* --- contact --- */
  phone: string;
  whatsapp: string;
  email: string | null;
  address_ar: string;
  address_he: string;
  maps_url: string | null;
  hours_text_ar: string;
  hours_text_he: string;

  /* --- social --- */
  instagram: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;

  /* --- footer --- */
  footer_text_ar: string;
  footer_text_he: string;

  /* --- business --- */
  currency: string;
  timezone: string;
  booking_enabled: boolean;
  online_payments_enabled: boolean;

  /* --- booking config --- */
  booking_max_days_ahead: number;
  booking_min_notice_minutes: number;
  booking_slot_interval_minutes: number;

  /* --- SEO --- */
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  favicon_url: string | null;
  og_image_url: string | null;

  /* --- analytics (configuration only) --- */
  ga_measurement_id: string | null;
  gtm_id: string | null;
  meta_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  google_site_verification: string | null;

  /* --- payments (configuration only) --- */
  payments_enabled: boolean;
  payments_provider: string;
  payments_public_key: string | null;
  payments_success_url: string | null;
  payments_cancel_url: string | null;
  payments_mode: string;
};

export const PAYMENT_PROVIDERS = [
  "none",
  "stripe",
  "tranzila",
  "cardcom",
  "pelecard",
  "meshulam",
  "green_invoice",
] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

/** Neutral fallbacks used only before settings load / when the row is missing. */
export const SETTINGS_DEFAULTS = {
  currency: "₪",
  timezone: "Asia/Jerusalem",
  bookingEnabled: true,
  maxDaysAhead: 60,
  minNoticeMinutes: 0,
  slotIntervalMinutes: 0,
} as const;

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings" as never).select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as unknown as SiteSettings | null;
    },
    staleTime: 60_000,
  });
}

/** Pick the value for the active language from an `_ar` / `_he` pair. */
export function localized<T extends Record<string, unknown>>(
  row: T | null | undefined,
  base: string,
  lang: "ar" | "he",
  fallback = "",
): string {
  if (!row) return fallback;
  const v = row[`${base}_${lang}` as keyof T];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export type ServiceCategory = {
  id: string;
  slug: string;
  name_ar: string;
  name_he: string;
  sort_order: number;
  is_active: boolean;
};

export function useServiceCategories(activeOnly = true) {
  return useQuery({
    queryKey: ["service-categories", activeOnly],
    queryFn: async () => {
      let q = supabase.from("service_categories" as never).select("*").order("sort_order");
      if (activeOnly) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as ServiceCategory[];
    },
    staleTime: 60_000,
  });
}
