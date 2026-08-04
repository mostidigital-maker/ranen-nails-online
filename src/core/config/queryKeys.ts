/**
 * Single registry of every React Query key used in the app.
 * Keeping them here prevents duplicated fetches and mismatched invalidations.
 *
 * NOTE: the string values intentionally match the historical keys so caches,
 * realtime invalidation and existing behaviour stay identical.
 */
export const QK = {
  siteSettings: ["site-settings"] as const,
  siteSettingsAdmin: ["site-settings-admin"] as const,

  servicesPublic: ["services-public"] as const,
  servicesAdmin: ["services-admin"] as const,
  categoriesPublic: (activeOnly: boolean) => ["service-categories", activeOnly] as const,
  categoriesPublicRoot: ["service-categories"] as const,
  categoriesAdmin: ["categories-admin"] as const,

  galleryPublic: ["gallery-public"] as const,
  galleryAdmin: ["gallery-admin"] as const,

  statsPublic: ["stats-public"] as const,
  statsAdmin: ["stats-admin"] as const,

  aboutPublic: ["about-cards-public"] as const,
  aboutAdmin: ["about-admin"] as const,

  testimonialsPublic: ["testimonials-public"] as const,
  testimonialsAdmin: ["testimonials-admin"] as const,

  faqsPublic: ["faqs-public"] as const,
  faqsAdmin: ["faqs-admin"] as const,

  appointments: ["appointments"] as const,
  businessHours: ["business-hours"] as const,
  blockedSlots: ["blocked-slots"] as const,
  slots: (date?: string, duration?: number) =>
    (date === undefined ? (["slots"] as const) : (["slots", date, duration] as const)),
} as const;
