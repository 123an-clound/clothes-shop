"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { cartCount, cartSubtotal, type CartLine } from "@/lib/cart";
import { formatVnd } from "@/lib/money";
import { calcShippingFee } from "@/lib/shipping";
import { useCart } from "./cart-provider";

export function QtyStepper({ line }: { line: CartLine }) {
  const { setQty } = useCart();
  const btn = "grid size-11 cursor-pointer place-items-center text-lg font-bold hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex items-center border-2 border-line">
      <button type="button" className={btn} aria-label={`Giảm số lượng ${line.name}`} onClick={() => setQty(line.variantId, line.qty - 1)}>
        −
      </button>
      <span className="w-8 text-center font-bold" aria-live="polite" aria-label={`Số lượng ${line.qty}`}>
        {line.qty}
      </span>
      <button
        type="button"
        className={btn}
        aria-label={`Tăng số lượng ${line.name}`}
        disabled={line.qty >= Math.min(line.maxQty, 20)}
        onClick={() => setQty(line.variantId, line.qty + 1)}
      >
        +
      </button>
    </div>
  );
}

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { remove } = useCart();
  return (
    <li className="flex gap-4 border-b border-line py-4">
      {/* Duplicate of the name link: hidden from AT and tab order. */}
      <Link
        href={`/products/${line.slug}`}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden="true"
        className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-surface"
      >
        {line.image && <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-2">
          <Link href={`/products/${line.slug}`} onClick={onNavigate} className="text-sm font-bold uppercase hover:underline">
            {line.name}
          </Link>
          <span className="shrink-0 text-sm font-bold">{formatVnd(line.price * line.qty)}</span>
        </div>
        <p className="text-xs text-muted">
          {line.color} / {line.size}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <QtyStepper line={line} />
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            className="min-h-11 cursor-pointer text-xs font-bold uppercase underline underline-offset-4 hover:text-danger"
          >
            Xoá
          </button>
        </div>
      </div>
    </li>
  );
}

export function ShippingHint({ subtotal }: { subtotal: number }) {
  const { shipping } = useCart();
  const fee = calcShippingFee(subtotal, shipping);
  const left = shipping.free_threshold - subtotal;
  return (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-muted">Phí giao hàng</span>
        <span>{fee === 0 ? "Miễn phí" : formatVnd(fee)}</span>
      </div>
      {left > 0 && (
        <p className="text-xs text-muted">
          Mua thêm <strong className="text-fg">{formatVnd(left)}</strong> để được miễn phí giao hàng.
        </p>
      )}
    </>
  );
}

/** Side drawer on a native modal <dialog>: focus trap, Esc and inert background for free. */
export function CartDrawer() {
  const { lines, isOpen, close } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const subtotal = cartSubtotal(lines);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    if (!isOpen && d.open) d.close();
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="cart-title"
      onClose={close}
      onClick={(e) => e.target === ref.current && close()}
      data-lenis-prevent
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-md border-l-2 border-fg bg-bg p-0 text-fg backdrop:bg-black/60 open:animate-[slide-in_250ms_ease-out]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id="cart-title" className="text-2xl uppercase">
            Giỏ hàng ({cartCount(lines)})
          </h2>
          <button type="button" onClick={close} aria-label="Đóng giỏ hàng" className="grid size-11 cursor-pointer place-items-center">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
            <p className="font-display text-3xl font-bold uppercase">Giỏ hàng trống</p>
            <p className="text-muted">Chọn vài món đồ bạn thích nhé.</p>
            <Link href="/shop" onClick={close} className={buttonClass("primary")}>
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5">
              {lines.map((l) => (
                <CartLineItem key={l.variantId} line={l} onNavigate={close} />
              ))}
            </ul>
            <div className="flex flex-col gap-3 border-t-2 border-fg px-5 py-4">
              <div className="flex justify-between font-bold">
                <span>Tạm tính</span>
                <span>{formatVnd(subtotal)}</span>
              </div>
              <ShippingHint subtotal={subtotal} />
              <Link href="/checkout" onClick={close} className={buttonClass("primary", "h-14 w-full text-base")}>
                Thanh toán
              </Link>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
