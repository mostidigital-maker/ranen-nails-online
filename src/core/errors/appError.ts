import { toast } from "sonner";

/**
 * Application-wide error model.
 * Every service throws (or returns) errors that are normalised here so the UI
 * can present a single, consistent set of states.
 */
export type AppErrorKind =
  | "validation"
  | "permission"
  | "notFound"
  | "network"
  | "database"
  | "unknown";

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly cause?: unknown;

  constructor(message: string, kind: AppErrorKind = "unknown", cause?: unknown) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.cause = cause;
  }
}

/** Turn anything thrown (Supabase error, Error, string) into an AppError. */
export function toAppError(err: unknown, fallback = "Unexpected error"): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new AppError(err.message, "unknown", err);
  if (typeof err === "string") return new AppError(err, "unknown", err);
  if (err && typeof err === "object" && "message" in err) {
    return new AppError(String((err as { message: unknown }).message), "database", err);
  }
  return new AppError(fallback, "unknown", err);
}

export function getErrorMessage(err: unknown, fallback = "Unexpected error"): string {
  return toAppError(err, fallback).message;
}

/** Standard "something failed" side effect: toast + console for diagnostics. */
export function reportError(err: unknown, fallback = "Unexpected error"): AppError {
  const appError = toAppError(err, fallback);
  console.error("[app-error]", appError.kind, appError.message, appError.cause ?? "");
  toast.error(appError.message || fallback);
  return appError;
}

export function reportSuccess(message: string) {
  toast.success(message);
}

/** Throws when a Supabase call returned an error; keeps services terse. */
export function assertNoError(error: { message: string } | null, kind: AppErrorKind = "database") {
  if (error) throw new AppError(error.message, kind, error);
}
