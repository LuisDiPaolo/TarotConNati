export const API_ERROR_CODES = [
  "FEATURE_NOT_ENABLED",
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "PAYMENT_WEBHOOK_INVALID_SIGNATURE",
  "PAYMENT_PROVIDER_NOT_CONFIGURED",
  "PAYMENT_PROVIDER_ERROR",
  "COUPON_NOT_AVAILABLE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiSuccess<T> = {
  data: T;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiError(code: ApiErrorCode, message: string): ApiError {
  return { error: { code, message } };
}
