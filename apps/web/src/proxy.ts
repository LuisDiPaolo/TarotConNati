import { NextResponse, type NextRequest } from "next/server";

const PANEL_PREFIX = "/panel";
const PANEL_SUBDOMAIN = "panel";

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

function isPanelHost(hostname: string) {
  return hostname === PANEL_SUBDOMAIN || hostname.startsWith(`${PANEL_SUBDOMAIN}.`);
}

function withPanelSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(PANEL_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const hostname = getHostname(request);
  const panelHost = isPanelHost(hostname);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (panelHost) {
    if (pathname.startsWith(PANEL_PREFIX)) {
      return withPanelSecurityHeaders(NextResponse.next());
    }

    const rewritten = request.nextUrl.clone();
    rewritten.pathname = pathname === "/" ? PANEL_PREFIX : `${PANEL_PREFIX}${pathname}`;
    return withPanelSecurityHeaders(NextResponse.rewrite(rewritten));
  }

  if (pathname.startsWith(PANEL_PREFIX)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map)).*)",
  ],
};
