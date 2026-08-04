/**
 * Reusable validation helpers.
 * Components never validate inline — they call these and surface the message.
 */
export type ValidationResult = { ok: true } | { ok: false; message: string };

export const valid: ValidationResult = { ok: true };
export function invalid(message: string): ValidationResult {
  return { ok: false, message };
}

export function isFilled(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

export function requireFields(
  fields: Array<string | null | undefined>,
  message: string,
): ValidationResult {
  return fields.every(isFilled) ? valid : invalid(message);
}

export function isPositiveNumber(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export function isFutureDate(value: Date, message: string): ValidationResult {
  return value.getTime() > Date.now() ? valid : invalid(message);
}

export function isEndAfterStart(start: Date, end: Date, message: string): ValidationResult {
  return end > start ? valid : invalid(message);
}

export function clampRating(value: unknown, min = 1, max = 5): number {
  return Math.min(max, Math.max(min, Number(value) || max));
}

/** Runs validators in order and returns the first failure. */
export function firstError(...results: ValidationResult[]): ValidationResult {
  for (const r of results) if (!r.ok) return r;
  return valid;
}
