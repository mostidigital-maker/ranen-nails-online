import { APP_CONFIG } from "@/core/config/app.config";
import type { Lang } from "@/shared/types/common";
import { localeTag } from "./localized";

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseHM(s: string): { h: number; m: number } {
  const [h, m] = s.split(":").map(Number);
  return { h, m: m || 0 };
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Local `YYYY-MM-DD` for "today", used as the min date of date inputs. */
export function todayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Combine a `YYYY-MM-DD` + `HH:MM` pair into a local Date. */
export function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function formatDate(value: string | Date, lang: Lang): string {
  return new Date(value).toLocaleDateString(localeTag(lang));
}

export function formatTime(value: string | Date, lang: Lang): string {
  return new Date(value).toLocaleTimeString(localeTag(lang), { hour: "2-digit", minute: "2-digit" });
}

/** Strip non-digits, keeping WhatsApp/tel links well-formed. */
export function digitsOnly(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/** Local number (05x…) → international (9725x…). */
export function toInternational(value: string): string {
  return digitsOnly(value).replace(/^0/, APP_CONFIG.phone.countryCode);
}
