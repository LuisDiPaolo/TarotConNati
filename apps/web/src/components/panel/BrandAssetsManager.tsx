"use client";

import { ImageIcon, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { updatePwaHeadLinks } from "@/lib/pwa/head-links";
import { BrandAssetCropper, type BrandAssetCropConfig } from "./BrandAssetCropper";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

type BrandAssetType = "logo" | "logoLight" | "logoDark" | "publicIcon" | "panelIcon" | "maskableIcon" | "appleTouchIcon";

type AssetConfig = BrandAssetCropConfig & {
  type: BrandAssetType;
  label: string;
  currentUrl: (business: PanelBusinessSettings) => string;
};

type BrandAssetUploadResponse = {
  publicUrl?: string;
  error?: { message?: string };
};

const ASSET_SETTING_KEYS = {
  logo: "logoUrl",
  logoLight: "logoLightUrl",
  logoDark: "logoDarkUrl",
  publicIcon: "publicAppIconUrl",
  panelIcon: "panelAppIconUrl",
  maskableIcon: "maskableIconUrl",
  appleTouchIcon: "appleTouchIconUrl",
} as const satisfies Record<BrandAssetType, keyof PanelBusinessSettings>;

const PANEL_HEAD_REFRESH_ASSETS = new Set<BrandAssetType>(["panelIcon", "maskableIcon", "appleTouchIcon"]);

const ASSET_CONFIGS: AssetConfig[] = [
  {
    type: "logo",
    label: "Logo principal",
    title: "Recortar logo",
    helpText: "Arrastra para encuadrar el logo. Se usa cuando no cargaste una version especifica para modo claro u oscuro.",
    outputWidth: 900,
    outputHeight: 300,
    outputMimeType: "image/webp",
    fileSuffix: "logo",
    outputQuality: 0.82,
    maxOutputBytes: 180 * 1024,
    previewWidth: 108,
    previewHeight: 36,
    currentUrl: (business) => business.logoUrl,
  },
  {
    type: "logoLight",
    label: "Logo modo claro",
    title: "Recortar logo claro",
    helpText: "Usa una version que se lea bien sobre fondos claros. Ideal si el logo tiene texto oscuro o colores finos.",
    outputWidth: 900,
    outputHeight: 300,
    outputMimeType: "image/webp",
    fileSuffix: "logo-light",
    outputQuality: 0.82,
    maxOutputBytes: 180 * 1024,
    previewWidth: 108,
    previewHeight: 36,
    currentUrl: (business) => business.logoLightUrl || business.logoUrl,
  },
  {
    type: "logoDark",
    label: "Logo modo oscuro",
    title: "Recortar logo oscuro",
    helpText: "Usa una version que se lea bien sobre fondos oscuros. Conviene para logos con texto negro o bajo contraste.",
    outputWidth: 900,
    outputHeight: 300,
    outputMimeType: "image/webp",
    fileSuffix: "logo-dark",
    outputQuality: 0.82,
    maxOutputBytes: 180 * 1024,
    previewWidth: 108,
    previewHeight: 36,
    currentUrl: (business) => business.logoDarkUrl || business.logoUrl,
  },
  {
    type: "publicIcon",
    label: "Icono pagina publica",
    title: "Recortar icono de la pagina publica",
    helpText: "Recomendado: subir un logo sin fondo y elegir aca el color de fondo. Se usa como icono de acceso rapido y en la pestana del navegador.",
    outputWidth: 512,
    outputHeight: 512,
    outputMimeType: "image/webp",
    fileSuffix: "public-icon",
    outputQuality: 0.86,
    maxOutputBytes: 96 * 1024,
    allowBackgroundColor: true,
    defaultBackgroundColor: "#111827",
    previewWidth: 52,
    previewHeight: 52,
    currentUrl: (business) => business.publicAppIconUrl,
  },
  {
    type: "panelIcon",
    label: "Icono del panel",
    title: "Recortar icono del panel",
    helpText: "Recomendado: subir un logo sin fondo y elegir un color de fondo que funcione para el panel administrativo.",
    outputWidth: 512,
    outputHeight: 512,
    outputMimeType: "image/webp",
    fileSuffix: "panel-icon",
    outputQuality: 0.86,
    maxOutputBytes: 96 * 1024,
    allowBackgroundColor: true,
    defaultBackgroundColor: "#0f172a",
    previewWidth: 52,
    previewHeight: 52,
    currentUrl: (business) => business.panelAppIconUrl,
  },
  {
    type: "maskableIcon",
    label: "Icono Android seguro",
    title: "Recortar icono para Android",
    helpText: "Deja margen visual alrededor del logo para que no se corte cuando el telefono redondea el icono.",
    outputWidth: 512,
    outputHeight: 512,
    outputMimeType: "image/webp",
    fileSuffix: "maskable-icon",
    outputQuality: 0.86,
    maxOutputBytes: 96 * 1024,
    allowBackgroundColor: true,
    defaultBackgroundColor: "#111827",
    previewWidth: 52,
    previewHeight: 52,
    currentUrl: (business) => business.maskableIconUrl,
  },
  {
    type: "appleTouchIcon",
    label: "Icono iPhone y iPad",
    title: "Recortar icono para iPhone y iPad",
    helpText: "Usa un logo con fondo solido para que se vea bien al guardar el acceso en la pantalla de inicio.",
    outputWidth: 180,
    outputHeight: 180,
    outputMimeType: "image/png",
    fileSuffix: "apple-touch-icon",
    maxOutputBytes: 160 * 1024,
    allowBackgroundColor: true,
    defaultBackgroundColor: "#111827",
    previewWidth: 52,
    previewHeight: 52,
    currentUrl: (business) => business.appleTouchIconUrl,
  },
];

function AssetPreview({ config, business }: { config: AssetConfig; business: PanelBusinessSettings }) {
  const url = config.currentUrl(business);

  if (!url) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-neutral-700 dark:bg-neutral-900">
        <ImageIcon aria-hidden="true" className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="max-h-full max-w-full object-contain" src={url} />
    </div>
  );
}

export function BrandAssetsManager({
  business,
  onBusinessChange,
}: {
  business: PanelBusinessSettings;
  onBusinessChange?: (business: PanelBusinessSettings) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedConfig, setSelectedConfig] = useState<AssetConfig | null>(null);
  const [cropSource, setCropSource] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  function pickAsset(config: AssetConfig) {
    if (state === "uploading") return;

    setSelectedConfig(config);
    setMessage("");
    fileInputRef.current?.click();
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setState("error");
      setMessage("Selecciona un archivo de imagen valido.");
      return;
    }

    setCropSource(file);
  }

  async function uploadAsset(file: File) {
    if (!selectedConfig || state === "uploading") return;
    setState("uploading");
    setMessage("");

    const formData = new FormData();
    formData.set("assetType", selectedConfig.type);
    formData.set("file", file);

    const response = await fetch("/api/panel/brand-assets", {
      method: "POST",
      body: formData,
    }).catch(() => null);

    const data = await response?.json().catch(() => null) as BrandAssetUploadResponse | null;

    if (!response?.ok || !data?.publicUrl) {
      setState("error");
      setMessage(data?.error?.message ?? "No se pudo guardar la imagen.");
      return;
    }

    const assetSettingKey = ASSET_SETTING_KEYS[selectedConfig.type];
    const updatedBusiness: PanelBusinessSettings = { ...business, [assetSettingKey]: data.publicUrl };
    onBusinessChange?.(updatedBusiness);
    setState("idle");
    setCropSource(null);
    setSelectedConfig(null);
    setMessage("Imagen guardada.");

    if (PANEL_HEAD_REFRESH_ASSETS.has(selectedConfig.type)) {
      const assets = await updatePwaHeadLinks("/api/pwa/panel-manifest", "/pwa/panel/icon.svg");
      navigator.serviceWorker?.controller?.postMessage({ type: "SET_BRAND_ASSETS", value: assets });
    }

    router.refresh();
  }

  return (
    <section className="surface grid gap-5 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <ImageIcon aria-hidden="true" className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-black">Imagenes de marca</h2>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      <p className="text-sm text-muted">
        Carga el logo y los iconos que vera el cliente en la pagina publica, el navegador y los accesos guardados en el telefono. Si el logo cambia segun fondo claro u oscuro, carga esas variantes.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ASSET_CONFIGS.map((config) => (
          <article key={config.type} className="grid gap-3 rounded-lg border border-slate-200 bg-white/50 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
            <div className="flex items-center justify-between gap-3">
              <AssetPreview config={config} business={business} />
              <button className="icon-action" disabled={state === "uploading"} onClick={() => pickAsset(config)} title={`Cargar ${config.label}`} type="button">
                <Upload aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-black">{config.label}</h3>
              <p className="mt-1 text-xs text-muted">{config.currentUrl(business) ? "Imagen cargada" : "Pendiente"}</p>
            </div>
          </article>
        ))}
      </div>

      {message ? <p className={`text-sm font-semibold ${state === "error" ? "text-red-600" : "text-emerald-600"}`}>{message}</p> : null}
      {state === "uploading" ? <p className="text-sm font-semibold text-muted">Subiendo imagen...</p> : null}

      {cropSource && selectedConfig ? (
        <BrandAssetCropper
          file={cropSource}
          config={selectedConfig}
          onCancel={() => {
            if (state === "uploading") return;
            setCropSource(null);
            setSelectedConfig(null);
          }}
          onConfirm={uploadAsset}
        />
      ) : null}
    </section>
  );
}
