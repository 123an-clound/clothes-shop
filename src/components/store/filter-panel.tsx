"use client";

import { useRef } from "react";
import { CloseIcon, FilterIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SORTS, type Sort } from "@/lib/filters";
import type { Facets } from "@/services/catalog";
import { useShopNav } from "./shop-shell";

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "Dưới 300K", max: 299_999 },
  { label: "300K – 600K", min: 300_000, max: 600_000 },
  { label: "600K – 1 triệu", min: 600_000, max: 1_000_000 },
  { label: "Trên 1 triệu", min: 1_000_000 },
];

const SORT_LABELS: Record<Sort, string> = {
  new: "Mới nhất",
  "price-asc": "Giá tăng dần",
  "price-desc": "Giá giảm dần",
  best: "Bán chạy",
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const chip =
  "min-h-11 cursor-pointer rounded-box border-2 px-3 text-sm font-bold transition-colors aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-bg border-line hover:border-fg";

function FilterControls({ facets }: { facets: Facets }) {
  const { filters, apply } = useShopNav();
  return (
    <div className="flex flex-col gap-8">
      {facets.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-xs font-bold tracking-widest uppercase">Kích cỡ</legend>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={filters.sizes.includes(s)}
                onClick={() => apply({ sizes: toggle(filters.sizes, s) })}
                className={`${chip} min-w-11`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {facets.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-xs font-bold tracking-widest uppercase">Màu sắc</legend>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-pressed={filters.colors.includes(c.name)}
                onClick={() => apply({ colors: toggle(filters.colors, c.name) })}
                className={`${chip} flex items-center gap-2`}
              >
                <span className="size-4 shrink-0 border border-line" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-xs font-bold tracking-widest uppercase">Khoảng giá</legend>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((r) => {
            const active = filters.min === r.min && filters.max === r.max;
            return (
              <button
                key={r.label}
                type="button"
                aria-pressed={active}
                onClick={() => apply(active ? { min: undefined, max: undefined } : { min: r.min, max: r.max })}
                className={chip}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

export function SortSelect() {
  const { filters, apply } = useShopNav();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Sắp xếp</span>
      <select
        value={filters.sort}
        onChange={(e) => apply({ sort: e.target.value as Sort })}
        className="min-h-11 cursor-pointer rounded-box border-2 border-line bg-bg px-3 font-bold text-fg focus:border-accent"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}

function activeCount(f: ReturnType<typeof useShopNav>["filters"]) {
  return f.sizes.length + f.colors.length + (f.min !== undefined || f.max !== undefined ? 1 : 0);
}

export function ClearFilters({ className = "" }: { className?: string }) {
  const { filters, apply } = useShopNav();
  if (activeCount(filters) === 0) return null;
  return (
    <button
      type="button"
      onClick={() => apply({ sizes: [], colors: [], min: undefined, max: undefined })}
      className={`min-h-11 cursor-pointer text-sm font-bold underline underline-offset-4 hover:text-accent-ink ${className}`}
    >
      Xoá bộ lọc
    </button>
  );
}

/** Desktop: sticky sidebar. Mobile: native <dialog> bottom sheet (focus trap + Esc for free). */
export function FilterPanel({ facets, total }: { facets: Facets; total: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { filters } = useShopNav();
  const count = activeCount(filters);

  return (
    <>
      <aside aria-label="Bộ lọc" className="hidden lg:block">
        <div className="sticky top-24 flex flex-col gap-6">
          <FilterControls facets={facets} />
          <ClearFilters className="self-start" />
        </div>
      </aside>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="flex min-h-11 cursor-pointer items-center gap-2 border-2 border-fg px-4 text-sm font-bold uppercase"
        >
          <FilterIcon />
          Bộ lọc{count > 0 && ` (${count})`}
        </button>
        <dialog
          ref={dialogRef}
          aria-label="Bộ lọc sản phẩm"
          className="m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto border-t-2 border-fg bg-bg p-0 text-fg backdrop:bg-black/60"
          onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-xl font-bold uppercase">Bộ lọc</p>
            <button
              type="button"
              aria-label="Đóng bộ lọc"
              onClick={() => dialogRef.current?.close()}
              className="grid size-11 cursor-pointer place-items-center"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="px-4 py-6">
            <FilterControls facets={facets} />
          </div>
          <div className="sticky bottom-0 flex items-center gap-4 border-t border-line bg-bg px-4 py-3">
            <ClearFilters />
            <Button type="button" className="flex-1" onClick={() => dialogRef.current?.close()}>
              Xem {total} sản phẩm
            </Button>
          </div>
        </dialog>
      </div>
    </>
  );
}
