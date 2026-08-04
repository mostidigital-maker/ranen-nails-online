/** Site-wide settings: the single source of truth for every business value. */
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

export type SiteSettingsPatch = Partial<Omit<SiteSettings, "id">>;
