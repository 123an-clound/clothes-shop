"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadImages } from "@/components/admin/image-upload";

export type GalleryImage = { key: string; url: string; alt: string; color: string };

type Props = { images: GalleryImage[]; onChange: (images: GalleryImage[]) => void; colors: string[]; onRemove: (url: string) => void };

const small = "min-h-11 min-w-11 cursor-pointer border-2 border-line px-2 text-xs font-bold hover:border-fg disabled:cursor-not-allowed disabled:opacity-30";

/** Multi-upload gallery with reorder (buttons: keyboard + screen-reader friendly), alt text and color tag. */
export function GalleryEditor({ images, onChange, colors, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const room = Math.max(0, 20 - images.length);
    const { urls, errors: errs } = await uploadImages([...files].slice(0, room), "products");
    setBusy(false);
    setErrors(files.length > room ? [...errs, `Chỉ thêm được ${room} ảnh (tối đa 20).`] : errs);
    onChange([...images, ...urls.map((url) => ({ key: crypto.randomUUID(), url, alt: "", color: "" }))]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(i: number, d: -1 | 1) {
    const next = [...images];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="min-h-11 cursor-pointer border-2 border-fg px-4 text-sm font-bold uppercase disabled:opacity-50">
          {busy ? "Đang tải lên…" : "+ Tải ảnh lên (nhiều ảnh)"}
        </button>
        <span className="text-xs text-muted">JPG/PNG/WebP/AVIF, tối đa 5MB/ảnh. Ảnh đầu tiên là ảnh đại diện.</span>
        <input ref={inputRef} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => onFiles(e.target.files)} aria-label="Chọn ảnh sản phẩm" />
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="text-sm text-danger">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {images.length === 0 ? (
        <p className="border-2 border-dashed border-line p-6 text-center text-sm text-muted">Chưa có ảnh nào.</p>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.key} className="flex flex-col gap-2 border-2 border-line p-3">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                <Image src={img.url} alt={img.alt} fill sizes="300px" className="object-cover" />
                {i === 0 && <span className="absolute top-2 left-2 bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent uppercase">Ảnh đại diện</span>}
              </div>
              <label className="flex flex-col gap-1 text-xs font-bold uppercase">
                Mô tả ảnh (alt)
                <input
                  className="min-h-11 border-2 border-line bg-surface px-2 text-sm font-normal text-fg normal-case focus:border-accent-ink focus:outline-none"
                  value={img.alt}
                  maxLength={200}
                  onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold uppercase">
                Gắn với màu
                <select
                  className="min-h-11 cursor-pointer border-2 border-line bg-surface px-2 text-sm font-normal text-fg normal-case"
                  value={img.color}
                  onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))}
                >
                  <option value="">Tất cả màu</option>
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <button type="button" className={small} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Đưa ảnh ${i + 1} lên trước`}>
                  ←
                </button>
                <button type="button" className={small} disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Đưa ảnh ${i + 1} ra sau`}>
                  →
                </button>
                <button
                  type="button"
                  className={`${small} ml-auto text-danger`}
                  onClick={() => {
                    onRemove(img.url);
                    onChange(images.filter((_, j) => j !== i));
                  }}
                  aria-label={`Xoá ảnh ${i + 1}`}
                >
                  Xoá
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
