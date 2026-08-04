import type { Lang } from "@/shared/types/common";

/** Pick the `_ar` / `_he` variant of a field for the active language. */
export function localized<T extends Record<string, unknown>>(
  row: T | null | undefined,
  base: string,
  lang: Lang,
  fallback = "",
): string {
  if (!row) return fallback;
  const v = row[`${base}_${lang}` as keyof T];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

/** Same as `localized` but for already-loaded, guaranteed rows. */
export function pickLang(ar: string, he: string, lang: Lang): string {
  return lang === "ar" ? ar : he;
}

export function localeTag(lang: Lang): string {
  return lang === "ar" ? "ar" : "he";
}
