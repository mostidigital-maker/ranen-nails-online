import { table } from "@/core/supabase/db";
import { assertNoError } from "@/core/errors/appError";
import type { SiteSettings, SiteSettingsPatch } from "./types";

const TABLE = "site_settings";
const ROW_ID = 1;

/** All site-settings reads/writes go through this service. */
export const siteSettingsService = {
  async get(): Promise<SiteSettings | null> {
    const { data, error } = await table(TABLE).select("*").eq("id", ROW_ID).maybeSingle();
    assertNoError(error as { message: string } | null);
    return (data as unknown as SiteSettings) ?? null;
  },

  /** Narrow projection used by the booking engine (avoids over-fetching). */
  async getBookingConfig() {
    const { data } = await table(TABLE)
      .select("booking_enabled,booking_max_days_ahead,booking_min_notice_minutes,booking_slot_interval_minutes")
      .eq("id", ROW_ID)
      .maybeSingle();
    return (data || null) as unknown as {
      booking_enabled: boolean;
      booking_max_days_ahead: number;
      booking_min_notice_minutes: number;
      booking_slot_interval_minutes: number;
    } | null;
  },

  async update(patch: SiteSettingsPatch): Promise<void> {
    const { error } = await table(TABLE).update(patch as never).eq("id", ROW_ID);
    assertNoError(error as { message: string } | null);
  },
};
