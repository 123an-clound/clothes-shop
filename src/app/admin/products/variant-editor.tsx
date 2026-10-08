"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProductInput } from "@/lib/validation/admin";

export type VariantRow = ProductInput["variants"][number] & { key: string };

const cell = "min-h-11 w-full border-2 border-line bg-surface px-2 text-sm text-fg focus:border-accent-ink focus:outline-none aria-invalid:border-danger";

const newKey = () => crypto.randomUUID();

type Props = {
  rows: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
  slug: string;
  errors: Record<string, string[] | undefined>;
};

/** Variant table + "generate matrix" helper (sizes × colors). */
export function VariantEditor({ rows, onChange, slug, errors }: Props) {
  const [sizes, setSizes] = useState("S, M, L, XL");
  const [colors, setColors] = useState("Đen #111111\nTrắng #f2f2f2");
  const [stock, setStock] = useState(10);
  const err = (i: number, k: string) => errors[`variants.${i}.${k}`]?.[0];

  function update(i: number, patch: Partial<VariantRow>) {
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function generate() {
    const sizeList = sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colorList = colors
      .split("\n")
      .map((l) => l.trim().match(/^(.+?)\s+(#[0-9a-fA-F]{6})$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => ({ name: m[1].trim(), hex: m[2] }));
    const existing = new Set(rows.map((r) => `${r.size.toLowerCase()}|${r.color.toLowerCase()}`));
    const base = (slug || "SP").toUpperCase().slice(0, 40);
    const added: VariantRow[] = [];
    colorList.forEach((c, ci) =>
      sizeList.forEach((s) => {
        if (existing.has(`${s.toLowerCase()}|${c.name.toLowerCase()}`)) return;
        added.push({ key: newKey(), id: "", size: s, color: c.name, color_hex: c.hex, sku: `${base}-${s}-${ci + 1}`.replace(/[^A-Za-z0-9_-]/g, ""), price: null, stock });
      }),
    );
    onChange([...rows, ...added]);
  }

  return (
    <div className="flex flex-col gap-4">
      <details className="border-2 border-line p-4">
        <summary className="min-h-11 cursor-pointer content-center text-sm font-bold uppercase">Tạo nhanh biến thể (size × màu)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
          <label className="flex flex-col gap-1 text-xs font-bold uppercase">
            Các size (phân cách bằng dấu phẩy)
            <input className={cell} value={sizes} onChange={(e) => setSizes(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold uppercase">
            Màu (mỗi dòng: Tên #mã)
            <textarea className={`${cell} min-h-20 py-1`} value={colors} onChange={(e) => setColors(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold uppercase">
            Tồn kho mỗi biến thể
            <input className={cell} type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </label>
        </div>
        <Button type="button" variant="outline" className="mt-3" onClick={generate}>
          Tạo biến thể
        </Button>
      </details>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <caption className="sr-only">Biến thể sản phẩm</caption>
          <thead>
            <tr className="text-xs text-muted uppercase">
              <th className="pb-2">Size</th>
              <th className="pb-2">Màu</th>
              <th className="pb-2">Mã màu</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2">Giá riêng</th>
              <th className="pb-2">Tồn kho</th>
              <th className="pb-2">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className="align-top">
                <td className="pr-2 pb-2">
                  <input aria-label={`Size dòng ${i + 1}`} aria-invalid={err(i, "size") ? true : undefined} title={err(i, "size")} className={`${cell} w-20`} value={r.size} onChange={(e) => update(i, { size: e.target.value })} />
                </td>
                <td className="pr-2 pb-2">
                  <input aria-label={`Màu dòng ${i + 1}`} aria-invalid={err(i, "color") ? true : undefined} title={err(i, "color")} className={cell} value={r.color} onChange={(e) => update(i, { color: e.target.value })} />
                </td>
                <td className="pr-2 pb-2">
                  <input aria-label={`Mã màu dòng ${i + 1}`} type="color" className="h-11 w-14 cursor-pointer border-2 border-line bg-surface" value={r.color_hex} onChange={(e) => update(i, { color_hex: e.target.value })} />
                </td>
                <td className="pr-2 pb-2">
                  <input aria-label={`SKU dòng ${i + 1}`} aria-invalid={err(i, "sku") ? true : undefined} title={err(i, "sku")} className={cell} value={r.sku} onChange={(e) => update(i, { sku: e.target.value })} />
                </td>
                <td className="pr-2 pb-2">
                  <input
                    aria-label={`Giá riêng dòng ${i + 1} (để trống = giá sản phẩm)`}
                    type="number"
                    min={0}
                    placeholder="Mặc định"
                    className={`${cell} w-32`}
                    value={r.price ?? ""}
                    onChange={(e) => update(i, { price: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </td>
                <td className="pr-2 pb-2">
                  <input aria-label={`Tồn kho dòng ${i + 1}`} aria-invalid={err(i, "stock") ? true : undefined} type="number" min={0} className={`${cell} w-24`} value={r.stock} onChange={(e) => update(i, { stock: Number(e.target.value) })} />
                </td>
                <td className="pb-2">
                  <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`Xoá biến thể ${r.size} ${r.color}`} className="min-h-11 cursor-pointer px-2 text-sm font-bold text-danger underline underline-offset-4">
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {Object.entries(errors).some(([k]) => k.startsWith("variants")) && (
        <ul className="text-sm text-danger" role="alert">
          {Object.entries(errors)
            .filter(([k]) => k.startsWith("variants"))
            .map(([k, v]) => {
              const row = k.split(".")[1];
              return <li key={k}>{row !== undefined && /^\d+$/.test(row) ? `Dòng ${Number(row) + 1}: ` : ""}{v?.[0]}</li>;
            })}
        </ul>
      )}
      <Button type="button" variant="ghost" className="self-start" onClick={() => onChange([...rows, { key: newKey(), id: "", size: "", color: "", color_hex: "#111111", sku: "", price: null, stock: 0 }])}>
        + Thêm 1 biến thể
      </Button>
    </div>
  );
}
