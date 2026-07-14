type ManifestIcon = {
  src?: string;
  sizes?: string;
  type?: string;
  purpose?: string;
};

type PwaManifest = {
  apple_touch_icon?: string;
  icons?: ManifestIcon[];
};

function replaceHeadLink(rel: string, href: string, attributes: Record<string, string> = {}) {
  document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`).forEach((link) => link.remove());
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  for (const [name, value] of Object.entries(attributes)) link.setAttribute(name, value);
  document.head.appendChild(link);
}

function pickManifestIcon(manifest: PwaManifest, purpose: "any" | "maskable") {
  return manifest.icons?.find((icon) => icon.src && icon.purpose?.split(" ").includes(purpose)) ?? null;
}

export async function updatePwaHeadLinks(manifestUrl: string, fallbackIconUrl: string) {
  replaceHeadLink("manifest", manifestUrl);

  try {
    const response = await fetch(manifestUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("manifest_fetch_failed");

    const manifest = (await response.json()) as PwaManifest;
    const appIcon = pickManifestIcon(manifest, "any");
    const iconUrl = appIcon?.src ?? fallbackIconUrl;

    const iconAttributes: Record<string, string> = appIcon?.type ? { type: appIcon.type, sizes: appIcon.sizes ?? "512x512" } : {};
    replaceHeadLink("icon", iconUrl, iconAttributes);
    replaceHeadLink("shortcut icon", iconUrl, iconAttributes);
    replaceHeadLink("apple-touch-icon", manifest.apple_touch_icon || iconUrl);
  } catch {
    replaceHeadLink("icon", fallbackIconUrl);
    replaceHeadLink("shortcut icon", fallbackIconUrl);
    replaceHeadLink("apple-touch-icon", fallbackIconUrl);
  }
}
