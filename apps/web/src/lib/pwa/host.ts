export const PANEL_SUBDOMAIN = "panel";

export function isPanelHostname(hostname: string) {
  const normalized = hostname.split(":")[0]?.toLowerCase() ?? "";
  return normalized === PANEL_SUBDOMAIN || normalized.startsWith(`${PANEL_SUBDOMAIN}.`);
}
