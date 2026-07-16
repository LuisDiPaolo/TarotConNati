import { headers } from "next/headers";
import { PanelHomePage } from "@/components/panel/PanelHomePage";
import { PublicHomePage } from "@/components/public/PublicHomePage";
import { isConfiguredPanelHost } from "@/lib/business/instance";

export const dynamic = "force-dynamic";

function hostnameFromHeaders(headerStore: Headers) {
  const rawHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const [hostname = ""] = rawHost.split(":");
  return hostname.toLowerCase();
}

export default async function HomePage() {
  const headerStore = await headers();

  if (isConfiguredPanelHost(hostnameFromHeaders(headerStore))) {
    return <PanelHomePage />;
  }

  return <PublicHomePage />;
}
