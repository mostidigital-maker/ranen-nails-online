import { APP_CONFIG } from "@/core/config/app.config";
import { siteSettingsService } from "@/features/settings/siteSettings.service";
import { bookingService } from "./booking.service";
import type { Slot } from "./types";
import { overlaps, pad2, parseHM } from "@/shared/utils/datetime";

/**
 * Booking availability rules — pure business logic, no React.
 *
 * Computes bookable start times for `dateStr` (YYYY-MM-DD, local) for a
 * service of `durationMin`, excluding: closed days, the booking window,
 * minimum notice, existing pending/confirmed appointments and admin blocks.
 */
export async function getAvailableSlots(
  dateStr: string,
  durationMin: number,
): Promise<{ slots: Slot[]; closed: boolean }> {
  if (!dateStr || !durationMin) return { slots: [], closed: false };

  const [y, mo, d] = dateStr.split("-").map(Number);
  const dayStart = new Date(y, mo - 1, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, mo - 1, d, 23, 59, 59, 999);
  const dow = dayStart.getDay();

  // 0) admin-editable booking configuration
  const cfg = await siteSettingsService.getBookingConfig();
  if (cfg && cfg.booking_enabled === false) return { slots: [], closed: true };

  const maxDaysAhead = cfg?.booking_max_days_ahead ?? APP_CONFIG.defaults.maxDaysAhead;
  if (maxDaysAhead > 0) {
    const limit = new Date();
    limit.setHours(23, 59, 59, 999);
    limit.setDate(limit.getDate() + maxDaysAhead);
    if (dayStart > limit) return { slots: [], closed: false };
  }

  // 1) opening hours for this weekday
  const hoursRow = await bookingService.getHoursForDay(dow);
  if (!hoursRow || hoursRow.is_closed) return { slots: [], closed: true };

  // 2) busy ranges + admin blocks for this day, in parallel
  const [busy, blocks] = await Promise.all([
    bookingService.getBusyRanges(dayStart.toISOString(), dayEnd.toISOString()),
    bookingService.listBlocksInRange(dayStart.toISOString(), dayEnd.toISOString()),
  ]);

  const busyRanges: Array<[Date, Date]> = [
    ...busy.map((r) => [new Date(r.start_at), new Date(r.end_at)] as [Date, Date]),
    ...blocks.map((r) => [new Date(r.start_at), new Date(r.end_at)] as [Date, Date]),
  ];

  const open = parseHM(hoursRow.open_time);
  const close = parseHM(hoursRow.close_time);
  // A global appointment interval (when set) overrides the per-day step.
  const step = (cfg?.booking_slot_interval_minutes || 0) > 0
    ? cfg!.booking_slot_interval_minutes
    : (hoursRow.slot_step_minutes || APP_CONFIG.defaults.slotStepMinutes);

  const openDt = new Date(y, mo - 1, d, open.h, open.m, 0, 0);
  const closeDt = new Date(y, mo - 1, d, close.h, close.m, 0, 0);
  const earliest = new Date(
    Date.now() + (cfg?.booking_min_notice_minutes ?? APP_CONFIG.defaults.minNoticeMinutes) * 60000,
  );

  const slots: Slot[] = [];
  for (let t = new Date(openDt); ; t = new Date(t.getTime() + step * 60000)) {
    const end = new Date(t.getTime() + durationMin * 60000);
    if (end > closeDt) break;
    if (t <= earliest) continue;

    let busyHit = false;
    for (const [bs, be] of busyRanges) {
      if (overlaps(t, end, bs, be)) { busyHit = true; break; }
    }
    if (busyHit) continue;

    const label = `${pad2(t.getHours())}:${pad2(t.getMinutes())}`;
    slots.push({ value: label, label });
  }

  return { slots, closed: false };
}
