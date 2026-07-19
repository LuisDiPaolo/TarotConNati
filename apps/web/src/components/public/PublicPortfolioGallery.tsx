"use client";

import { ExternalLink, Images, Instagram, Music2 } from "lucide-react";
import { useEffect } from "react";
import type { PublicPortfolioItem } from "@/lib/operations/booking.types";

type SocialProvider = "instagram" | "tiktok" | "unknown";

declare global {
  interface Window {
    instgrm?: { Embeds?: { process?: () => void } };
  }
}

function getSocialProvider(value: string): SocialProvider {
  if (!value) return "unknown";
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host.endsWith("instagram.com")) return getInstagramPermalink(value) ? "instagram" : "unknown";
    if (host.endsWith("tiktok.com")) return "tiktok";
  } catch {
    return "unknown";
  }
  return "unknown";
}

function getInstagramPermalink(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!host.endsWith("instagram.com")) return "";

    const parts = url.pathname.split("/").filter(Boolean);
    const typeIndex = parts.findIndex((part) => ["p", "reel", "tv"].includes(part));
    const type = parts[typeIndex];
    const code = parts[typeIndex + 1];
    if (!type || !code) return "";

    return `https://www.instagram.com/${type}/${code}/`;
  } catch {
    return "";
  }
}

function getTikTokVideoId(value: string) {
  const match = value.match(/\/video\/(\d+)/);
  return match?.[1] ?? "";
}

function loadScriptOnce(id: string, src: string, onLoad?: () => void) {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    onLoad?.();
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  if (onLoad) script.addEventListener("load", onLoad, { once: true });
  document.body.appendChild(script);
}

function SocialEmbed({ url, title }: { url: string; title: string }) {
  const provider = getSocialProvider(url);
  const tikTokVideoId = provider === "tiktok" ? getTikTokVideoId(url) : "";

  if (provider === "instagram") {
    const instagramUrl = getInstagramPermalink(url);

    return (
      <blockquote
        className="instagram-media !m-0 !min-w-0 !w-full"
        data-instgrm-captioned=""
        data-instgrm-permalink={instagramUrl}
        data-instgrm-version="14"
      >
        <a href={instagramUrl} rel="noopener noreferrer" target="_blank">{title}</a>
      </blockquote>
    );
  }

  if (provider === "tiktok" && tikTokVideoId) {
    return (
      <blockquote className="tiktok-embed !m-0 !min-w-0 !w-full" cite={url} data-video-id={tikTokVideoId}>
        <section>
          <a href={url} rel="noopener noreferrer" target="_blank">{title}</a>
        </section>
      </blockquote>
    );
  }

  return (
    <a className="grid h-full min-h-[260px] place-items-center bg-slate-100 p-6 text-center text-sm font-bold text-slate-500 transition hover:text-primary dark:bg-white/5 dark:text-slate-300" href={url} rel="noopener noreferrer" target="_blank">
      <span className="grid gap-2">
        <ExternalLink aria-hidden="true" className="mx-auto h-8 w-8" />
        Abrir publicacion
      </span>
    </a>
  );
}

export function PublicPortfolioGallery({ items }: { items: PublicPortfolioItem[] }) {
  useEffect(() => {
    const hasInstagram = items.some((item) => getSocialProvider(item.instagramUrl) === "instagram");
    const hasTikTok = items.some((item) => getSocialProvider(item.instagramUrl) === "tiktok" && getTikTokVideoId(item.instagramUrl));

    if (hasInstagram) {
      loadScriptOnce("instagram-embed-script", "https://www.instagram.com/embed.js", () => window.instgrm?.Embeds?.process?.());
      window.instgrm?.Embeds?.process?.();
    }
    if (hasTikTok) loadScriptOnce("tiktok-embed-script", "https://www.tiktok.com/embed.js");
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section className="surface overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Portfolio</p>
          <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Trabajos y resultados</h2>
        </div>
        <Images aria-hidden="true" className="h-7 w-7 text-primary" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const provider = getSocialProvider(item.instagramUrl);
          const hasEmbed = provider === "instagram" || provider === "tiktok";
          const ProviderIcon = provider === "tiktok" ? Music2 : Instagram;
          const content = (
            <article className="group h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg dark:border-white/10 dark:bg-white/5">
              <div className="relative min-h-[260px] overflow-hidden bg-slate-100 dark:bg-white/5">
                {hasEmbed ? (
                  <SocialEmbed title={item.title} url={item.instagramUrl} />
                ) : item.imageUrl ? (
                  <div className="aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" src={item.imageUrl} />
                  </div>
                ) : (
                  <div className="grid min-h-[260px] place-items-center text-slate-400">
                    <InstagramFallback />
                  </div>
                )}
                {item.instagramUrl ? (
                  <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-slate-950/80 text-white shadow-lg backdrop-blur-md">
                    <ProviderIcon aria-hidden="true" className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2 p-4">
                {item.category ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{item.category}</p> : null}
                <h3 className="text-lg font-black leading-tight">{item.title}</h3>
                {item.description ? <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p> : null}
              </div>
            </article>
          );

          return item.instagramUrl && !hasEmbed ? (
            <a aria-label={`Abrir ${item.title}`} className="block" href={item.instagramUrl} key={item.id} rel="noopener noreferrer" target="_blank">
              {content}
            </a>
          ) : (
            <div key={item.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}

function InstagramFallback() {
  return (
    <span className="grid gap-2 text-center text-sm font-bold">
      <Images aria-hidden="true" className="mx-auto h-8 w-8" />
      Ver publicacion
    </span>
  );
}
