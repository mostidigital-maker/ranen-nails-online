/**
 * Central application configuration.
 *
 * Every tunable value that is NOT admin-editable lives here so future
 * modules can be configured without touching business logic.
 */

export const APP_CONFIG = {
  /** Supabase storage buckets used by the platform. */
  storage: {
    galleryBucket: "gallery",
  },

  /** Media constraints for uploads. */
  media: {
    maxUploadBytes: 50 * 1024 * 1024,
    accept: "image/*,video/*",
    /** Signed URL lifetimes (seconds). */
    publicSignedUrlTtl: 60 * 60 * 24 * 7,
    adminSignedUrlTtl: 60 * 60,
  },

  /** React Query defaults per data kind (ms). */
  cache: {
    settingsStaleTime: 60_000,
    contentStaleTime: 60_000,
    slotsStaleTime: 30_000,
  },

  /** Fallbacks used before site settings load or when a column is empty. */
  defaults: {
    currency: "₪",
    timezone: "Asia/Jerusalem",
    bookingEnabled: true,
    maxDaysAhead: 60,
    minNoticeMinutes: 0,
    slotIntervalMinutes: 0,
    slotStepMinutes: 30,
    serviceDurationMinutes: 60,
  },

  /** Country calling code used when normalising local phone numbers. */
  phone: {
    countryCode: "972",
  },

  /**
   * Feature flags for modules that are architecturally prepared but not
   * shipped yet. Flip to `true` once the module lands.
   */
  modules: {
    booking: true,
    gallery: true,
    testimonials: true,
    faq: true,
    stats: true,
    analytics: true,
    payments: false,
    notifications: false,
    crm: false,
    pwa: false,
    coupons: false,
    giftCards: false,
    memberships: false,
    reports: false,
    importExport: false,
    whiteLabel: false,
  },
} as const;

export type AppModule = keyof typeof APP_CONFIG.modules;

export function isModuleEnabled(module: AppModule): boolean {
  return APP_CONFIG.modules[module];
}
