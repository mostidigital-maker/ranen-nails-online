/**
 * Payments module — configuration only for now.
 * The provider list and modes live here so the checkout implementation can be
 * added later without touching settings UI or business logic.
 */
export const PAYMENT_PROVIDERS = [
  "none",
  "stripe",
  "tranzila",
  "cardcom",
  "pelecard",
  "meshulam",
  "green_invoice",
] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_MODES = ["sandbox", "live"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export type PaymentsConfig = {
  enabled: boolean;
  onlineAtBooking: boolean;
  provider: PaymentProvider;
  mode: PaymentMode;
  publicKey: string | null;
  successUrl: string | null;
  cancelUrl: string | null;
};

/** Maps the settings row onto a provider-agnostic config object. */
export function readPaymentsConfig(row: {
  payments_enabled: boolean;
  online_payments_enabled: boolean;
  payments_provider: string;
  payments_mode: string;
  payments_public_key: string | null;
  payments_success_url: string | null;
  payments_cancel_url: string | null;
}): PaymentsConfig {
  return {
    enabled: row.payments_enabled,
    onlineAtBooking: row.online_payments_enabled,
    provider: (PAYMENT_PROVIDERS as readonly string[]).includes(row.payments_provider)
      ? (row.payments_provider as PaymentProvider)
      : "none",
    mode: row.payments_mode === "live" ? "live" : "sandbox",
    publicKey: row.payments_public_key,
    successUrl: row.payments_success_url,
    cancelUrl: row.payments_cancel_url,
  };
}
