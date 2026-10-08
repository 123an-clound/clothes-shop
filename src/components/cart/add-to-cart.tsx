"use client";

import { Button } from "@/components/ui/button";
import type { ProductDetail, Variant } from "@/services/catalog";
import { useCart } from "./cart-provider";

type Props = { product: Pick<ProductDetail, "slug" | "name" | "images">; variant: Variant | null; allSoldOut: boolean };

export function AddToCart({ product, variant, allSoldOut }: Props) {
  const { add, open, lines } = useCart();
  const inCart = variant ? (lines.find((l) => l.variantId === variant.id)?.qty ?? 0) : 0;
  const atLimit = variant !== null && inCart >= Math.min(variant.stock, 20);

  const label = allSoldOut
    ? "Hết hàng"
    : variant === null
      ? "Chọn kích cỡ"
      : atLimit
        ? "Đã đạt số lượng tối đa"
        : "Thêm vào giỏ";

  function onAdd() {
    if (!variant) return;
    const image = product.images.find((i) => i.color === variant.color) ?? product.images[0];
    add({
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      image: image?.url ?? "",
      size: variant.size,
      color: variant.color,
      price: variant.price,
      qty: 1,
      maxQty: variant.stock,
    });
    open();
  }

  return (
    <Button type="button" onClick={onAdd} disabled={!variant || atLimit} className="h-14 w-full text-base">
      {label}
    </Button>
  );
}
