export function normalizeConfiguredDomain(value: string | undefined) {
  return (value ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .toLowerCase();
}

export function getConfiguredPublicOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL ?? "";
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed === "localhost" || trimmed.endsWith(".localhost")) return `http://${trimmed}:3000`;
  return `https://${trimmed}`;
}

export function getConfiguredPublicDomain() {
  return normalizeConfiguredDomain(getConfiguredPublicOrigin());
}

export function getConfiguredPanelDomain() {
  const publicDomain = getConfiguredPublicDomain();
  if (!publicDomain) return "panel.localhost";
  if (publicDomain === "localhost") return "panel.localhost";
  if (publicDomain.startsWith("www.")) return `panel.${publicDomain.slice(4)}`;
  return `panel.${publicDomain}`;
}

export function getConfiguredPanelOrigin() {
  const publicOrigin = getConfiguredPublicOrigin();
  if (!publicOrigin) return "";

  try {
    const url = new URL(publicOrigin);
    url.hostname = getConfiguredPanelDomain();
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function isLocalBusinessHost(hostname: string) {
  return (
    !hostname ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  );
}

export function isConfiguredPanelHost(hostname: string) {
  const normalized = normalizeConfiguredDomain(hostname);
  const panelDomain = getConfiguredPanelDomain();
  return normalized === panelDomain;
}

export function isConfiguredPublicHost(hostname: string) {
  const normalized = normalizeConfiguredDomain(hostname);
  const publicDomain = getConfiguredPublicDomain();
  if (!publicDomain) return isLocalBusinessHost(normalized);
  return normalized === publicDomain || normalized === `www.${publicDomain}`;
}
