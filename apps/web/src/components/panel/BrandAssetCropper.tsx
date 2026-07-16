"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";

type Transform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type PointerPoint = {
  x: number;
  y: number;
};

export type BrandAssetCropConfig = {
  title: string;
  helpText: string;
  outputWidth: number;
  outputHeight: number;
  outputMimeType: "image/png" | "image/webp";
  fileSuffix: string;
  outputQuality?: number;
  maxOutputBytes?: number;
  allowBackgroundColor?: boolean;
  defaultBackgroundColor?: string;
  previewWidth?: number;
  previewHeight?: number;
};

type BrandAssetCropperProps = {
  file: File;
  config: BrandAssetCropConfig;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void | Promise<void>;
};

async function createOrientedCanvas(file: File): Promise<HTMLCanvasElement> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
      bitmap.close();
      return canvas;
    } catch {
      // Some browsers reject imageOrientation; the Image fallback still loads the asset.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("brand_asset_load_failed"));
    };
    image.src = url;
  });
}

function getSafeAreaValue(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(name).replace("px", "").trim();
  const parsed = Number.parseFloat(rawValue);
  return Number.isFinite(parsed) ? Math.max(fallback, parsed) : fallback;
}

function getTwoPointers(points: Map<number, PointerPoint>): [PointerPoint, PointerPoint] | null {
  const values = Array.from(points.values());
  const first = values[0];
  const second = values[1];
  return first && second ? [first, second] : null;
}

function clampTransform(transform: Transform, imageWidth: number, imageHeight: number, cropWidth: number, cropHeight: number) {
  const scaledWidth = imageWidth * transform.scale;
  const scaledHeight = imageHeight * transform.scale;
  const minOffsetX = Math.min(0, cropWidth - scaledWidth);
  const minOffsetY = Math.min(0, cropHeight - scaledHeight);

  return {
    scale: transform.scale,
    offsetX: Math.min(0, Math.max(minOffsetX, transform.offsetX)),
    offsetY: Math.min(0, Math.max(minOffsetY, transform.offsetY)),
  };
}

function normalizeHexColor(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function drawPreview(
  canvas: HTMLCanvasElement | null,
  source: HTMLCanvasElement | null,
  transform: Transform,
  cropWidth: number,
  cropHeight: number,
  displayWidth: number,
  displayHeight: number,
  backgroundColor?: string,
) {
  if (!canvas || !source || cropWidth <= 0 || cropHeight <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(displayWidth * dpr);
  canvas.height = Math.round(displayHeight * dpr);
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const ratioX = displayWidth / cropWidth;
  const ratioY = displayHeight / cropHeight;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    transform.offsetX * ratioX,
    transform.offsetY * ratioY,
    source.width * transform.scale * ratioX,
    source.height * transform.scale * ratioY,
  );
}

function getOutputFileName(fileName: string, config: BrandAssetCropConfig) {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "asset";
  const extension = config.outputMimeType === "image/png" ? "png" : "webp";
  return `${baseName}-${config.fileSuffix}.${extension}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: BrandAssetCropConfig["outputMimeType"], quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

async function exportOptimizedBlob(canvas: HTMLCanvasElement, config: BrandAssetCropConfig) {
  const maxBytes = config.maxOutputBytes;

  if (config.outputMimeType === "image/png") {
    const blob = await canvasToBlob(canvas, config.outputMimeType);
    if (blob && maxBytes && blob.size > maxBytes) return null;
    return blob;
  }

  const initialQuality = config.outputQuality ?? 0.84;
  const qualities = [initialQuality, initialQuality - 0.08, initialQuality - 0.16, initialQuality - 0.24]
    .map((quality) => Math.max(0.62, Math.min(0.92, quality)));

  let smallestBlob: Blob | null = null;
  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, config.outputMimeType, quality);
    if (!blob) continue;
    if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob;
    if (!maxBytes || blob.size <= maxBytes) return blob;
  }

  if (smallestBlob && maxBytes && smallestBlob.size > maxBytes) return null;
  return smallestBlob;
}

export function BrandAssetCropper({ file, config, onCancel, onConfirm }: BrandAssetCropperProps) {
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [transform, setTransform] = useState<Transform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [ready, setReady] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState(() => normalizeHexColor(config.defaultBackgroundColor, "#111827"));

  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef<Map<number, PointerPoint>>(new Map());
  const pointerState = useRef({
    dragging: false,
    pinching: false,
    lastX: 0,
    lastY: 0,
    lastDistance: 0,
    lastMidX: 0,
    lastMidY: 0,
    lastTapAt: 0,
  });

  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const exportAspect = config.outputWidth / config.outputHeight;
  const previewWidth = config.previewWidth ?? (exportAspect >= 1 ? 72 : 56);
  const previewHeight = config.previewHeight ?? Math.round(previewWidth / exportAspect);

  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);

  useEffect(() => {
    setBackgroundColor(normalizeHexColor(config.defaultBackgroundColor, "#111827"));
  }, [config.defaultBackgroundColor]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    createOrientedCanvas(file)
      .then((canvas) => {
        if (!cancelled) setSourceCanvas(canvas);
      })
      .catch(() => {
        if (!cancelled) setSourceCanvas(null);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    const calculateSize = () => {
      const isDesktop = window.innerWidth >= 768;
      const safeTop = getSafeAreaValue("--safe-top", 16);
      const safeBottom = getSafeAreaValue("--safe-bottom", 16);
      const availableWidth = isDesktop ? Math.min(window.innerWidth - 96, 620) : window.innerWidth - 36;
      const availableHeight = isDesktop ? Math.min(window.innerHeight - 210, 430) : window.innerHeight - safeTop - safeBottom - 210;
      const widthFromHeight = availableHeight * exportAspect;
      const maxWidth = exportAspect >= 1 ? (isDesktop ? 520 : 540) : (isDesktop ? 360 : 420);
      const minWidth = exportAspect >= 1 ? 280 : 220;
      const nextWidth = Math.floor(Math.max(minWidth, Math.min(availableWidth, widthFromHeight, maxWidth)));
      const nextHeight = Math.floor(nextWidth / exportAspect);
      setCropWidth(nextWidth);
      setCropHeight(nextHeight);
    };

    calculateSize();
    window.addEventListener("resize", calculateSize);
    return () => window.removeEventListener("resize", calculateSize);
  }, [exportAspect]);

  const resetTransform = useCallback(() => {
    if (!sourceCanvas || cropWidth <= 0 || cropHeight <= 0) return;

    const minScale = Math.max(cropWidth / sourceCanvas.width, cropHeight / sourceCanvas.height);
    const centeredX = (cropWidth - sourceCanvas.width * minScale) / 2;
    const centeredY = (cropHeight - sourceCanvas.height * minScale) / 2;

    setTransform(clampTransform({ scale: minScale, offsetX: centeredX, offsetY: centeredY }, sourceCanvas.width, sourceCanvas.height, cropWidth, cropHeight));
    setReady(true);
  }, [cropHeight, cropWidth, sourceCanvas]);

  useEffect(() => {
    resetTransform();
  }, [resetTransform]);

  useEffect(() => {
    const iconBackgroundColor = config.allowBackgroundColor ? backgroundColor : undefined;
    drawPreview(cropCanvasRef.current, sourceCanvas, transform, cropWidth, cropHeight, cropWidth, cropHeight, iconBackgroundColor);
    drawPreview(previewCanvasRef.current, sourceCanvas, transform, cropWidth, cropHeight, previewWidth, previewHeight, iconBackgroundColor);
  }, [backgroundColor, config.allowBackgroundColor, cropHeight, cropWidth, previewHeight, previewWidth, sourceCanvas, transform]);

  const updateTransform = useCallback((updater: (current: Transform) => Transform) => {
    if (!sourceCanvas || cropWidth <= 0 || cropHeight <= 0) return;
    setTransform((current) => {
      const minScale = Math.max(cropWidth / sourceCanvas.width, cropHeight / sourceCanvas.height);
      const updated = updater(current);
      const boundedScale = Math.min(minScale * 6, Math.max(minScale, updated.scale));
      return clampTransform({ ...updated, scale: boundedScale }, sourceCanvas.width, sourceCanvas.height, cropWidth, cropHeight);
    });
  }, [cropHeight, cropWidth, sourceCanvas]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pointerState.current.dragging = true;
    pointerState.current.lastX = event.clientX;
    pointerState.current.lastY = event.clientY;
    setInteracting(true);

    const now = Date.now();
    if (now - pointerState.current.lastTapAt < 280 && activePointers.current.size === 1) resetTransform();
    pointerState.current.lastTapAt = now;

    if (activePointers.current.size === 2) {
      const pointers = getTwoPointers(activePointers.current);
      if (!pointers) return;
      const [first, second] = pointers;
      pointerState.current.pinching = true;
      pointerState.current.lastDistance = Math.hypot(first.x - second.x, first.y - second.y);
      pointerState.current.lastMidX = (first.x + second.x) / 2;
      pointerState.current.lastMidY = (first.y + second.y) / 2;
    }
  }, [resetTransform]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!pointerState.current.dragging || !sourceCanvas) return;

    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = cropFrameRef.current?.getBoundingClientRect();

    if (activePointers.current.size === 2 && pointerState.current.pinching) {
      const pointers = getTwoPointers(activePointers.current);
      if (!pointers) return;
      const [first, second] = pointers;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      const midX = (first.x + second.x) / 2;
      const midY = (first.y + second.y) / 2;
      const pinchFactor = distance / Math.max(1, pointerState.current.lastDistance);
      const relativeX = midX - (rect?.left ?? 0);
      const relativeY = midY - (rect?.top ?? 0);

      updateTransform((current) => {
        const nextScale = current.scale * pinchFactor;
        const scaleRatio = nextScale / current.scale;
        return {
          scale: nextScale,
          offsetX: relativeX - scaleRatio * (relativeX - current.offsetX) + (midX - pointerState.current.lastMidX),
          offsetY: relativeY - scaleRatio * (relativeY - current.offsetY) + (midY - pointerState.current.lastMidY),
        };
      });

      pointerState.current.lastDistance = distance;
      pointerState.current.lastMidX = midX;
      pointerState.current.lastMidY = midY;
      return;
    }

    const deltaX = event.clientX - pointerState.current.lastX;
    const deltaY = event.clientY - pointerState.current.lastY;
    pointerState.current.lastX = event.clientX;
    pointerState.current.lastY = event.clientY;

    updateTransform((current) => ({
      ...current,
      offsetX: current.offsetX + deltaX,
      offsetY: current.offsetY + deltaY,
    }));
  }, [sourceCanvas, updateTransform]);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(event.pointerId);
    if (activePointers.current.size < 2) pointerState.current.pinching = false;
    if (activePointers.current.size === 0) {
      pointerState.current.dragging = false;
      window.setTimeout(() => setInteracting(false), 180);
    }
  }, []);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!sourceCanvas) return;

    const rect = cropFrameRef.current?.getBoundingClientRect();
    const relativeX = event.clientX - (rect?.left ?? 0);
    const relativeY = event.clientY - (rect?.top ?? 0);
    const factor = event.deltaY < 0 ? 1.07 : 1 / 1.07;

    updateTransform((current) => {
      const nextScale = current.scale * factor;
      const scaleRatio = nextScale / current.scale;
      return {
        scale: nextScale,
        offsetX: relativeX - scaleRatio * (relativeX - current.offsetX),
        offsetY: relativeY - scaleRatio * (relativeY - current.offsetY),
      };
    });
  }, [sourceCanvas, updateTransform]);

  const exportImage = useCallback(async () => {
    if (!sourceCanvas || !ready || exporting || cropWidth <= 0 || cropHeight <= 0) return;

    setExportError(null);
    setExporting(true);
    const output = document.createElement("canvas");
    output.width = config.outputWidth;
    output.height = config.outputHeight;
    const ctx = output.getContext("2d");

    if (!ctx) {
      setExporting(false);
      return;
    }

    const ratioX = config.outputWidth / cropWidth;
    const ratioY = config.outputHeight / cropHeight;
    if (config.allowBackgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, config.outputWidth, config.outputHeight);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      sourceCanvas,
      transform.offsetX * ratioX,
      transform.offsetY * ratioY,
      sourceCanvas.width * transform.scale * ratioX,
      sourceCanvas.height * transform.scale * ratioY,
    );

    const blob = await exportOptimizedBlob(output, config);
    if (!blob || blob.type !== config.outputMimeType) {
      setExportError("El navegador no pudo preparar la imagen optimizada.");
      setExporting(false);
      return;
    }

    const croppedFile = new File([blob], getOutputFileName(file.name, config), { type: config.outputMimeType });
    try {
      await onConfirm(croppedFile);
    } finally {
      setExporting(false);
    }
  }, [backgroundColor, config, cropHeight, cropWidth, exporting, file.name, onConfirm, ready, sourceCanvas, transform]);

  return (
    <div className="fixed inset-0 z-[260] flex items-stretch justify-center bg-black/70 text-white backdrop-blur-sm md:items-center md:p-5">
      <button aria-label="Cerrar recorte" className="absolute inset-0 cursor-default" disabled={exporting} onClick={onCancel} type="button" />
      <section className="relative h-full w-full overflow-hidden bg-neutral-950 md:h-auto md:max-h-[calc(100dvh-40px)] md:max-w-[680px] md:rounded-2xl md:border md:border-white/10 md:shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" aria-hidden className="absolute inset-0 h-full w-full scale-105 object-cover opacity-70 blur-lg brightness-50" src={objectUrl} />
        <div className="absolute inset-0 bg-black/20" />

        <header className="relative z-20 flex items-center justify-between gap-4 px-5 pb-3" style={{ paddingTop: "calc(var(--safe-top) + 14px)" }}>
          <button className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-black text-white transition hover:bg-black/45 disabled:opacity-60" disabled={exporting} onClick={onCancel} type="button">
            Cancelar
          </button>
          <div className="min-w-0 text-center">
            <h2 className="truncate text-sm font-black sm:text-base">{config.title}</h2>
            <p className="hidden text-xs text-white/60 sm:block">{config.outputWidth} x {config.outputHeight}</p>
          </div>
          <button className="primary-action bg-emerald-600 disabled:opacity-60" disabled={!ready || exporting} onClick={() => void exportImage()} type="button">
            {exporting ? "Procesando" : "Listo"}
          </button>
        </header>

        <div className="relative z-10 flex min-h-[calc(var(--app-height)-180px)] items-center justify-center px-5 py-4 md:min-h-[430px]">
          <div
            ref={cropFrameRef}
            className="relative touch-none select-none overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-2xl"
            style={{ width: cropWidth, height: cropHeight }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            <canvas ref={cropCanvasRef} className="h-full w-full" />
            <div className={`pointer-events-none absolute inset-0 transition-opacity ${interacting ? "opacity-100" : "opacity-0"}`}>
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/10" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/10" />
              <div className="absolute left-0 top-1/3 h-px w-full bg-white/10" />
              <div className="absolute left-0 top-2/3 h-px w-full bg-white/10" />
            </div>
          </div>
        </div>

        <footer className="relative z-20 grid gap-3 px-5 pb-5 md:grid-cols-[auto_auto_1fr] md:items-center" style={{ paddingBottom: "calc(var(--safe-bottom) + 18px)" }}>
          <div className="mx-auto overflow-hidden rounded-lg border border-white/15 bg-black/35 md:mx-0" style={{ width: previewWidth, height: previewHeight }}>
            <canvas ref={previewCanvasRef} className="h-full w-full" />
          </div>
          {config.allowBackgroundColor ? (
            <label className="mx-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-xs font-black text-white md:mx-0">
              Fondo
              <input
                aria-label="Color de fondo del icono"
                className="h-7 w-8 cursor-pointer rounded border border-white/20 bg-transparent"
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
              />
            </label>
          ) : null}
          <p className={`text-center text-xs leading-5 md:text-left ${exportError ? "text-red-200" : "text-white/60"}`}>
            {exportError ?? config.helpText}
          </p>
        </footer>

        {!ready ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          </div>
        ) : null}
      </section>
    </div>
  );
}
