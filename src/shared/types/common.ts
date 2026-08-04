/** Cross-module shared types. Kept intentionally tiny to avoid coupling. */

export type Lang = "ar" | "he";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

/** Any CMS row that can be ordered and hidden from the public site. */
export type OrderableRow = { id: string; sort_order: number };
export type ToggleableRow = OrderableRow & { is_active: boolean };

/** Bilingual value pair helper. */
export type Bilingual<K extends string> = { [P in `${K}_ar` | `${K}_he`]: string };
