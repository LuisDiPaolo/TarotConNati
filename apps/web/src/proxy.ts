import { NextResponse, type NextRequest } from "next/server";
import { isConfiguredPanelHost } from "@/lib/business/instance";

const PANEL_INTERNAL_BASE = "/panel";

const PANEL_SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

function getHostname(request: NextRequest) {
  const rawHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const [hostname = ""] = rawHost.split(":");
  return hostname.toLowerCase();
}

function isStaticAsset(pathname: string) {
  return /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|ttf|txt|webp|woff|woff2)$/i.test(pathname);
}

function isSharedRuntimeRoute(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

function withPanelSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(PANEL_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || isStaticAsset(pathname) || isSharedRuntimeRoute(pathname)) {
    return NextResponse.next();
  }

  const panelHost = isConfiguredPanelHost(getHostname(request));
  const internalPanelPath = pathname === PANEL_INTERNAL_BASE || pathname.startsWith(`${PANEL_INTERNAL_BASE}/`);

  if (!panelHost) {
    if (internalPanelPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (internalPanelPath) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.pathname = pathname.slice(PANEL_INTERNAL_BASE.length) || "/";
    return withPanelSecurityHeaders(NextResponse.redirect(cleanUrl));
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathname === "/" ? PANEL_INTERNAL_BASE : `${PANEL_INTERNAL_BASE}${pathname}`;
  return withPanelSecurityHeaders(NextResponse.rewrite(rewriteUrl));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map)).*)",
  ],
};
