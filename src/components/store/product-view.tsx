"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { formatVnd } from "@/lib/money";
import { AddToCart } from "@/components/cart/add-to-cart";
import type { ProductDetail } from "@/services/catalog";
import { BLUR } from "./product-card";

type Props = {
  product: ProductDetail;
  /** Server-rendered extras (description, policies) shown under the picker. */
  children?: React.ReactNode;
};

const LOW_STOCK = 5;

export function ProductView({ product, children }: Props) {
  const colors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string; inStock: boolean }>();
    for (const v of product.variants) {
      const c = map.get(v.color) ?? { name: v.color, hex: v.colorHex, inStock: false };
      c.inStock ||= v.stock > 0;
      map.set(v.color, c);
    }
    return [...map.values()];
  }, [product.variants]);

  const [color, setColor] = useState(() => colors.find((c) => c.inStock)?.name ?? colors[0]?.name ?? "");
  const sizesForColor = product.variants.filter((v) => v.color === color);
  const onlyOneSize = sizesForColor.length === 1;
  const [size, setSize] = useState<string | null>(onlyOneSize ? sizesForColor[0].size : null);
  const selected = sizesForColor.find((v) => v.size === size) ?? null;

  function pickColor(name: string) {
    setColor(name);
    const sizes = product.variants.filter((v) => v.color === name);
    // Keep the chosen size if it exists and is in stock in the new color.
    const keep = sizes.find((v) => v.size === size && v.stock > 0);
    setSize(keep ? keep.size : sizes.length === 1 ? sizes[0].size : null);
  }

  // Color-tagged images first for the selected color, then the rest.
  const images = useMemo(() => {
    const tagged = product.images.filter((i) => i.color === color);
    return [...tagged, ...product.images.filter((i) => i.color !== color)];
  }, [product.images, color]);
  const [active, setActive] = useState(0);
  const main = images[Math.min(active, images.length - 1)];

  const price = selected?.price ?? product.price;
  const purchasable = selected && selected.stock > 0 ? selected : null;
  const allSoldOut = colors.every((c) => !c.inStock);
  const sizesRef = useRef<HTMLFieldSetElement>(null);
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > price;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
      {/* Gallery */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-box bg-surface">
          {main && (
            <Image
              key={main.url}
              src={main.url}
              alt={main.alt || product.name}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 55vw, 100vw"
              placeholder="blur"
              blurDataURL={BLUR}
              className="animate-[fade-in_300ms_ease-out] object-cover"
            />
          )}
        </div>
        {images.length > 1 && (
          <ul className="grid grid-cols-5 gap-2" aria-label="Ảnh sản phẩm">
            {images.map((img, i) => (
              <li key={img.url}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Xem ảnh ${i + 1}`}
                  aria-current={i === active || undefined}
                  className="relative block aspect-square w-full cursor-pointer overflow-hidden border-2 border-transparent aria-current:border-fg"
                >
                  <Image src={img.url} alt="" fill sizes="20vw" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Info + picker */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl uppercase sm:text-6xl">{product.name}</h1>
          <p className="flex items-baseline gap-3 text-2xl">
            <span className="font-bold">{formatVnd(price)}</span>
            {onSale && (
              <s className="text-lg text-muted">
                <span className="sr-only">Giá gốc </span>
                {formatVnd(product.compareAtPrice!)}
              </s>
            )}
          </p>
        </div>

        <fieldset>
          <legend className="mb-3 text-xs font-bold tracking-widest uppercase">
            Màu: <span className="text-muted normal-case">{color}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-pressed={c.name === color}
                aria-label={`${c.name}${c.inStock ? "" : " (hết hàng)"}`}
                onClick={() => pickColor(c.name)}
                className="grid size-11 cursor-pointer place-items-center border-2 border-line aria-pressed:border-fg"
              >
                <span
                  className={`size-7 border border-line ${c.inStock ? "" : "opacity-40"}`}
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset ref={sizesRef}>
          <legend className="mb-3 text-xs font-bold tracking-widest uppercase">Kích cỡ</legend>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((v) => {
              const soldOut = v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={soldOut}
                  aria-pressed={v.size === size}
                  aria-label={`${v.size}${soldOut ? " (hết hàng)" : ""}`}
                  onClick={() => setSize(v.size)}
                  className="min-h-11 min-w-14 cursor-pointer border-2 border-line px-3 font-bold hover:border-fg disabled:cursor-not-allowed disabled:text-muted disabled:line-through disabled:hover:border-line aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-bg"
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          <p className="mt-3 min-h-6 text-sm" aria-live="polite">
            {selected === null ? (
              <span className="text-muted">Chọn kích cỡ để xem tình trạng hàng.</span>
            ) : selected.stock <= 0 ? (
              <span className="text-danger">Hết hàng</span>
            ) : selected.stock <= LOW_STOCK ? (
              <span className="font-bold text-accent-ink">Chỉ còn {selected.stock} sản phẩm</span>
            ) : (
              <span>Còn hàng</span>
            )}
          </p>
        </fieldset>

        <div className="hidden lg:block">
          <AddToCart product={product} variant={purchasable} allSoldOut={allSoldOut} />
        </div>

        {children}
      </div>

      {/* Mobile buy bar: sticks to the viewport bottom while the product is on screen, rests after it (never covers the footer). */}
      <div className="sticky bottom-0 z-30 -mx-4 flex items-center gap-3 border-t-2 border-fg bg-bg px-4 py-3 sm:-mx-8 sm:px-8 lg:hidden">
        <span className="shrink-0 text-lg font-bold">{formatVnd(price)}</span>
        <div className="flex-1">
          {purchasable || allSoldOut ? (
            <AddToCart product={product} variant={purchasable} allSoldOut={allSoldOut} />
          ) : (
            <button
              type="button"
              onClick={() => {
                sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                sizesRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
              }}
              className="flex h-14 w-full cursor-pointer items-center justify-center bg-accent text-base font-bold tracking-wider text-on-accent uppercase"
            >
              Chọn kích cỡ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
