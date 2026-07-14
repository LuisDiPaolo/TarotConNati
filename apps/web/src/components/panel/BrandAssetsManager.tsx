"use client";

import { ImageIcon, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandAssetCropper, type BrandAssetCropConfig } from "./BrandAssetCropper";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

type BrandAssetType = "logo" | "logoLight" | "logoDark" | "publicIcon" | "panelIcon" | "maskableIcon" | "appleTouchIcon";

type AssetConfig = BrandAssetCropConfig & {
  type: BrandAssetType;
  label: string;
  currentUrl: (business: PanelBusinessSettings) => string;
};

const ASSET_CONFIGS: AssetConfig[] = [
  {
    type: "logo",
    label: "Logo principal",
    title: "Recortar logo",
    helpText: "Arrastra para encuadrar el logo. Se guarda optimizado en WebP. Se usa como fallback si no hay variantes.",
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
    label: "Icono publico",
    title: "Recortar icono publico",
    helpText: "Recomendado: subir un logo PNG/WebP sin fondo y elegir aca el color de fondo. Se usa al instalar la PWA publica y como favicon del navegador.",
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
    label: "Icono panel",
    title: "Recortar icono panel",
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
    label: "Icono maskable",
    title: "Recortar icono maskable",
    helpText: "Recomendado: logo sin fondo, margen visual amplio y color de fondo elegido aca para que Android no corte contenido importante.",
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
    label: "Apple touch icon",
    title: "Recortar Apple touch icon",
    helpText: "Recomendado: logo sin fondo y color de fondo solido elegido aca, porque iOS no trata bien transparencias en iconos instalables.",
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

export function BrandAssetsManager({ business }: { business: PanelBusinessSettings }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedConfig, setSelectedConfig] = useState<AssetConfig | null>(null);
  const [cropSource, setCropSource] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  function pickAsset(config: AssetConfig) {
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
    if (!selectedConfig) return;
    setState("uploading");
    setMessage("");

    const formData = new FormData();
    formData.set("assetType", selectedConfig.type);
    formData.set("file", file);

    const response = await fetch("/api/panel/brand-assets", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setState("error");
      setMessage("No se pudo guardar el asset.");
      return;
    }

    setState("idle");
    setCropSource(null);
    setSelectedConfig(null);
    router.refresh();
  }

  return (
    <section className="surface grid gap-5 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <ImageIcon aria-hidden="true" className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-black">Assets de marca</h2>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      <p className="text-sm text-muted">
        Para iconos conviene pedir al prestador un logo sin fondo: desde el recorte se elige el color solido final. Para logos con texto o colores delicados, carga variante para modo claro y para modo oscuro.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ASSET_CONFIGS.map((config) => (
          <article key={config.type} className="grid gap-3 rounded-lg border border-slate-200 bg-white/50 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
            <div className="flex items-center justify-between gap-3">
              <AssetPreview config={config} business={business} />
              <button className="icon-action" onClick={() => pickAsset(config)} title={`Cargar ${config.label}`} type="button">
                <Upload aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-black">{config.label}</h3>
              <p className="mt-1 text-xs text-muted">{config.outputWidth} x {config.outputHeight}</p>
            </div>
          </article>
        ))}
      </div>

      {message ? <p className="text-sm font-semibold text-red-600">{message}</p> : null}
      {state === "uploading" ? <p className="text-sm font-semibold text-muted">Subiendo asset...</p> : null}

      {cropSource && selectedConfig ? (
        <BrandAssetCropper
          file={cropSource}
          config={selectedConfig}
          onCancel={() => {
            setCropSource(null);
            setSelectedConfig(null);
          }}
          onConfirm={uploadAsset}
        />
      ) : null}
    </section>
  );
}
