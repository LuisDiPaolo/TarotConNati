import type { NextRequest } from "next/server";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function normalizeBaseUrl(value: string | undefined | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    return stripTrailingSlash(url.origin);
  } catch {
    return "";
  }
}

export function getRequestBaseUrl(request: NextRequest) {
  return normalizeBaseUrl(process.env.APP_BASE_URL) || stripTrailingSlash(request.nextUrl.origin);
}
