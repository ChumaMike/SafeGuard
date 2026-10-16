"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickedPhoto {
  file: File;
  previewUrl: string;
  originalBytes: number;
}

interface PhotoPickerProps {
  name?: string;
  max?: number;
  required?: boolean;
  label?: string;
  hint?: string;
  onChange?: (files: File[]) => void;
  className?: string;
}

/**
 * Camera-first photo picker. Each picture is re-encoded on the device to ≤1280px JPEG at about
 * 200 KB before it leaves the phone: cheaper on data, and the canvas pass drops EXIF/GPS.
 * The compressed files are placed on a hidden <input name="photos"> so plain form posts work.
 */
export function PhotoPicker({ name = "photos", max = 5, required, label = "Photos", hint, onChange, className }: PhotoPickerProps) {
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    // Keep the hidden input in sync so <form action> submissions carry the compressed files.
    const input = hiddenRef.current;
    if (!input) return;
    try {
      const dt = new DataTransfer();
      for (const p of photos) dt.items.add(p.file);
      input.files = dt.files;
    } catch {
      /* DataTransfer not supported: parent must use onChange */
    }
    onChange?.(photos.map((p) => p.file));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.previewUrl)), [photos]);

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    try {
      const next: PickedPhoto[] = [];
      for (const f of Array.from(list).slice(0, max - photos.length)) {
        if (!f.type.startsWith("image/")) continue;
        const compressed = await compressImage(f);
        next.push({ file: compressed, previewUrl: URL.createObjectURL(compressed), originalBytes: f.size });
      }
      setPhotos((prev) => [...prev, ...next].slice(0, max));
    } finally {
      setBusy(false);
    }
  }

  function remove(i: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, j) => j !== i);
    });
  }

  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="text-sm font-medium">
        {label}
        {required && <span className="text-status-red"> *</span>}
      </legend>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}

      <div className="flex flex-wrap gap-2">
        <label className="tap inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90">
          <Camera className="size-5" aria-hidden />
          Take a photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={busy || photos.length >= max}
            onChange={(e) => void addFiles(e.target.files)}
            aria-describedby={`${id}-hint`}
          />
        </label>
        <label className="tap inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 font-medium hover:bg-accent">
          <ImagePlus className="size-5" aria-hidden />
          Choose from gallery
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy || photos.length >= max}
            onChange={(e) => void addFiles(e.target.files)}
          />
        </label>
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {busy ? "Compressing…" : `${photos.length} of ${max} photos. Pictures are shrunk on your phone and location data is removed.`}
      </p>

      <input ref={hiddenRef} type="file" name={name} multiple className="sr-only" tabIndex={-1} aria-hidden />

      {photos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <li key={p.previewUrl} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt={`Photo ${i + 1}`} className="size-24 rounded-lg border object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute -end-2 -top-2 flex size-8 items-center justify-center rounded-full border bg-background shadow"
              >
                <X className="size-4" aria-hidden />
              </button>
              <span className="mt-1 block text-center text-[10px] text-muted-foreground">{Math.round(p.file.size / 1024)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

/** Resize to ≤1280px and re-encode as JPEG, stepping quality down until ~200 KB. */
export async function compressImage(file: File, maxEdge = 1280, targetBytes = 200 * 1024): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.82;
  let blob = await toBlob(canvas, quality);
  while (blob && blob.size > targetBytes && quality > 0.5) {
    quality -= 0.08;
    blob = await toBlob(canvas, quality);
  }
  if (!blob) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}
