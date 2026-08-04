import { useQuery } from "@tanstack/react-query";
import { APP_CONFIG } from "@/core/config/app.config";
import { QK } from "@/core/config/queryKeys";
import { siteSettingsService } from "./siteSettings.service";
import { useLang } from "@/lib/i18n";
import { pickLang } from "@/shared/utils/localized";

/** Shared, deduplicated settings read used across the whole app. */
export function useSiteSettings() {
  return useQuery({
    queryKey: QK.siteSettings,
    queryFn: () => siteSettingsService.get(),
    staleTime: APP_CONFIG.cache.settingsStaleTime,
  });
}

/** Admin copy of the settings row (separate cache so editing is isolated). */
export function useSiteSettingsAdmin() {
  return useQuery({
    queryKey: QK.siteSettingsAdmin,
    queryFn: () => siteSettingsService.get(),
  });
}

/**
 * Derived, presentation-ready branding values.
 * Prevents every component from re-deriving name/currency/address by hand.
 */
export function useBranding() {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();

  return {
    settings,
    lang,
    businessName: settings ? pickLang(settings.business_name_ar, settings.business_name_he, lang) : t("brand"),
    tagline: settings ? pickLang(settings.tagline_ar, settings.tagline_he, lang) : t("tagline"),
    address: settings ? pickLang(settings.address_ar, settings.address_he, lang) : t("location"),
    currency: settings?.currency || APP_CONFIG.defaults.currency,
    bookingEnabled: settings?.booking_enabled !== false,
  };
}
