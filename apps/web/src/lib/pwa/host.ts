import { isConfiguredPanelHost } from "@/lib/business/instance";

export function isPanelHostname(hostname: string) {
  return isConfiguredPanelHost(hostname);
}
