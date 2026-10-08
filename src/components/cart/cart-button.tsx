"use client";

import { BagIcon } from "@/components/icons";
import { cartCount } from "@/lib/cart";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { lines, open } = useCart();
  const count = cartCount(lines);
  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
      className="relative grid size-11 cursor-pointer place-items-center hover:text-accent-ink"
    >
      <BagIcon />
      {count > 0 && (
        <span className="absolute top-1 right-0.5 grid min-w-5 place-items-center bg-accent px-1 text-[11px] leading-5 font-bold text-on-accent">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
