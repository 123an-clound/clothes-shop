"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET, storagePathOf } from "@/lib/images";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads straight to Supabase Storage (admin-only write policy; bucket enforces size + mime too). */
export async function uploadImages(files: File[], folder: string): Promise<{ urls: string[]; errors: string[] }> {
  const supabase = createClient();
  const urls: string[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const ext = TYPES[file.type];
    if (!ext) {
      errors.push(`${file.name}: chỉ nhận JPG, PNG, WebP, AVIF.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: tối đa 5MB.`);
      continue;
    }
    // Random name: never trust the original filename in a storage path.
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (error) {
      errors.push(`${file.name}: tải lên thất bại.`);
      continue;
    }
    urls.push(supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return { urls, errors };
}

/** Best-effort removal of files we uploaded (Unsplash seed URLs are ignored). */
export async function deleteImages(urls: string[]) {
  const paths = urls.map(storagePathOf).filter((p): p is string => p !== null);
  if (paths.length) await createClient().storage.from(STORAGE_BUCKET).remove(paths);
}

type SingleProps = { label: string; value: string; onChange: (url: string) => void; folder: string; aspect?: string; error?: string };

/** Single image field (category cover, logo, banner, OG image). */
export function ImageField({ label, value, onChange, folder, aspect = "aspect-[4/3]", error }: SingleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const shown = uploadError ?? error;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setUploadError(null);
    const { urls, errors } = await uploadImages([files[0]], folder);
    setBusy(false);
    if (errors.length) setUploadError(errors[0]);
    if (urls[0]) onChange(urls[0]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold tracking-wider uppercase">{label}</span>
      <div className={`relative ${aspect} w-full max-w-xs overflow-hidden border-2 border-dashed border-line bg-surface`}>
        {value ? (
          <Image src={value} alt="" fill sizes="320px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-xs text-muted">Chưa có ảnh</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="min-h-11 cursor-pointer border-2 border-fg px-3 text-xs font-bold uppercase disabled:opacity-50"
        >
          {busy ? "Đang tải lên…" : value ? "Đổi ảnh" : "Tải ảnh lên"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="min-h-11 cursor-pointer px-3 text-xs font-bold uppercase underline underline-offset-4 hover:text-danger">
            Gỡ ảnh
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={Object.keys(TYPES).join(",")} hidden onChange={(e) => onFiles(e.target.files)} aria-label={`${label}: chọn tệp`} />
      {shown && <p className="text-sm text-danger" role="alert">{shown}</p>}
    </div>
  );
}
