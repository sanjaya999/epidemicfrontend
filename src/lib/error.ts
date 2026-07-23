import { AxiosError } from "axios";

/**
 * The backend emits two error shapes:
 *  - FastAPI HTTPException (401/404/409/400/403): { detail: "..." }
 *  - Validation / generic envelope (422/500/429): { success, message, errors }
 * These helpers normalise both into something the UI can display.
 */
interface ApiErrorShape {
  detail?: string | { msg?: string }[];
  message?: string;
  errors?: Record<string, string>;
}

type AnyError = AxiosError<ApiErrorShape>;

/** Extract a single user-facing message from either backend error shape. */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const data = (error as AnyError)?.response?.data;
  if (!data) return fallback;

  // FastAPI HTTPException -> { detail: "User account is deactivated" }
  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }
  // FastAPI default validation -> { detail: [{ msg }] } (defensive)
  if (Array.isArray(data.detail) && data.detail.length) {
    const first = data.detail[0];
    if (first?.msg) return first.msg;
  }
  // Custom envelope -> { message: "Validation failed" }
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return fallback;
}

/** Extract field-level validation errors for mapping onto a form. */
export function getFieldErrors(error: unknown): Record<string, string> | null {
  const errors = (error as AnyError)?.response?.data?.errors;
  if (errors && typeof errors === "object" && Object.keys(errors).length) {
    return errors;
  }
  return null;
}
