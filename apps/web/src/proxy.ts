import { NextResponse, type NextRequest } from "next/server";
import { getConfiguredPanelOrigin, isConfiguredPanelHost } from "@/lib/business/instance";

const PANEL_PREFIX = "/panel";

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

function cleanPanelPath(pathname: string) {
  const stripped = pathname.slice(PANEL_PREFIX.length);
  if (!stripped || stripped === "/") return "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

function withPanelSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(PANEL_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const hostname = getHostname(request);
  const panelHost = isConfiguredPanelHost(hostname);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith(PANEL_PREFIX)) {
    const cleanPath = cleanPanelPath(pathname);

    if (panelHost) {
      const redirected = request.nextUrl.clone();
      redirected.pathname = cleanPath;
      return withPanelSecurityHeaders(NextResponse.redirect(redirected));
    }

    const panelOrigin = getConfiguredPanelOrigin();
    if (panelOrigin) {
      return NextResponse.redirect(new URL(`${cleanPath}${search}`, panelOrigin));
    }

    const redirected = request.nextUrl.clone();
    redirected.pathname = "/";
    redirected.search = "";
    return NextResponse.redirect(redirected);
  }

  if (panelHost) {
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = pathname === "/" ? PANEL_PREFIX : `${PANEL_PREFIX}${pathname}`;
    return withPanelSecurityHeaders(NextResponse.rewrite(rewritten));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map)).*)",
  ],
};
