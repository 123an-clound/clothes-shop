"use client";

import { useState, useTransition } from "react";
import { ImageField } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { Settings } from "@/lib/validation/settings";
import { saveSettings, type SettingsResult } from "../settings/actions";

type Banner = Settings["banners"][number] & { key: string };

const blank = (): Banner => ({ key: crypto.randomUUID(), image_url: "", title: "", subtitle: "", cta_label: "Mua ngay", cta_href: "/shop" });

/** Home banners: #1 = hero, #2 = split section. */
export function BannerEditor({ initial }: { initial: Settings["banners"] }) {
  const [banners, setBanners] = useState<Banner[]>(initial.map((b) => ({ ...b, key: crypto.randomUUID() })));
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, startTransition] = useTransition();
  const err = (i: number, k: string) => result?.errors?.[`${i}.${k}`]?.[0];

  const update = (i: number, patch: Partial<Banner>) => setBanners(banners.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...banners];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setBanners(next);
  };

  function save() {
    const value = banners.map((b) => ({ image_url: b.image_url, title: b.title, subtitle: b.subtitle, cta_label: b.cta_label, cta_href: b.cta_href }));
    startTransition(async () => setResult(await saveSettings("banners", value)));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-6"
    >
      <ol className="flex flex-col gap-6">
        {banners.map((b, i) => (
          <li key={b.key} className="grid gap-4 border-2 border-line p-4 lg:grid-cols-[20rem_1fr]">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold tracking-widest uppercase">
                Banner {i + 1} {i === 0 ? "· Hero trang chủ" : i === 1 ? "· Khối giữa trang" : "· Dự phòng"}
              </p>
              <ImageField label="Ảnh" folder="banners" aspect="aspect-video" value={b.image_url} error={err(i, "image_url")} onChange={(image_url) => update(i, { image_url })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tiêu đề" value={b.title} error={err(i, "title")} onChange={(e) => update(i, { title: e.target.value })} />
              <Field label="Mô tả ngắn" value={b.subtitle} error={err(i, "subtitle")} onChange={(e) => update(i, { subtitle: e.target.value })} />
              <Field label="Chữ trên nút" value={b.cta_label} error={err(i, "cta_label")} onChange={(e) => update(i, { cta_label: e.target.value })} />
              <Field label="Link nút" hint="Đường dẫn trong shop, ví dụ /shop/ao-thun" value={b.cta_href} error={err(i, "cta_href")} onChange={(e) => update(i, { cta_href: e.target.value })} />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="button" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Đưa banner ${i + 1} lên`}>
                  ↑ Lên
                </Button>
                <Button type="button" variant="ghost" disabled={i === banners.length - 1} onClick={() => move(i, 1)} aria-label={`Đưa banner ${i + 1} xuống`}>
                  ↓ Xuống
                </Button>
                <Button type="button" variant="ghost" className="ml-auto text-danger" onClick={() => setBanners(banners.filter((_, j) => j !== i))}>
                  Xoá banner
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {result && (
        <p role={result.ok ? "status" : "alert"} className={`text-sm ${result.ok ? "" : "text-danger"}`}>
          {result.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={banners.length >= 10} onClick={() => setBanners([...banners, blank()])}>
          + Thêm banner
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu banner"}
        </Button>
      </div>
    </form>
  );
}
