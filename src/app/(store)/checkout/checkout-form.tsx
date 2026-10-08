"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { CartLineItem, ShippingHint } from "@/components/cart/cart-drawer";
import { useCart } from "@/components/cart/cart-provider";
import { Button, buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cartSubtotal, reconcile } from "@/lib/cart";
import { formatVnd } from "@/lib/money";
import { calcShippingFee } from "@/lib/shipping";
import { checkoutSchema } from "@/lib/validation/checkout";
import { placeOrder, quoteVariants, type PlaceOrderState } from "./actions";

export type Prefill = {
  full_name: string | null;
  phone: string | null;
  address_line: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;
} | null;

export function CheckoutForm({ prefill, bankReady }: { prefill: Prefill; bankReady: boolean }) {
  const { lines, replace, clear, shipping } = useCart();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<PlaceOrderState, FormData>(placeOrder, {});
  const [clientErrors, setClientErrors] = useState<Record<string, string[] | undefined>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [quoteState, setQuoteState] = useState<"loading" | "ready" | "error">("loading");
  const [quoteRound, setQuoteRound] = useState(0);

  // Re-quote prices/stock from the server on load and whenever the DB rejected the cart.
  const lineIds = lines.map((l) => l.variantId).join(",");
  useEffect(() => {
    if (!lineIds) return;
    let cancelled = false;
    quoteVariants(lineIds.split(","))
      .then((quotes) => {
        if (cancelled) return;
        const { lines: next, changes } = reconcile(lines, quotes);
        if (changes.removed || changes.qtyReduced || changes.priceChanged) {
          replace(next);
          setNotice("Giỏ hàng đã được cập nhật theo giá và tồn kho mới nhất. Vui lòng kiểm tra lại.");
        }
        setQuoteState("ready");
      })
      .catch(() => !cancelled && setQuoteState("error"));
    return () => {
      cancelled = true;
    };
    // Only re-run when the set of lines changes or a re-quote is requested; `lines` itself is read fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIds, quoteRound]);

  // DB rejected the cart (stock/availability changed): request a fresh quote once per action result.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.cartChanged) setQuoteRound((n) => n + 1);
  }

  // Runs exactly once per successful order code.
  const doneCode = useRef<string | null>(null);
  useEffect(() => {
    if (state.ok && state.code && doneCode.current !== state.code) {
      doneCode.current = state.code;
      clear();
      router.replace(`/orders/${state.code}?new=1`);
    }
  }, [state, clear, router]);

  if (lines.length === 0 && !state.ok) {
    return (
      <div className="flex flex-col items-start gap-4 border-2 border-dashed border-line p-10">
        <p className="font-display text-3xl font-bold uppercase">Giỏ hàng trống</p>
        <Link href="/shop" className={buttonClass("primary")}>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  const total = subtotal + calcShippingFee(subtotal, shipping);
  const errors = { ...state.errors, ...clientErrors };
  const err = (k: string) => errors[k]?.[0];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Manual submit: avoids React's automatic form reset so typed values survive server errors.
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = checkoutSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      const first = Object.keys(z.flattenError(parsed.error).fieldErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setClientErrors({});
    fd.set("items", JSON.stringify(lines.map((l) => ({ variant_id: l.variantId, quantity: l.qty }))));
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="flex flex-col gap-10">
        <section aria-labelledby="ship-h" className="flex flex-col gap-5">
          <h2 id="ship-h" className="text-2xl uppercase">
            Thông tin giao hàng
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="recipient_name" label="Họ tên người nhận" autoComplete="name" required defaultValue={prefill?.full_name ?? ""} error={err("recipient_name")} />
            <Field name="phone" label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" required defaultValue={prefill?.phone ?? ""} error={err("phone")} />
          </div>
          <Field name="address_line" label="Địa chỉ (số nhà, tên đường)" autoComplete="street-address" required defaultValue={prefill?.address_line ?? ""} error={err("address_line")} />
          <div className="grid gap-5 sm:grid-cols-3">
            <Field name="ward" label="Phường / Xã" autoComplete="address-level3" defaultValue={prefill?.ward ?? ""} error={err("ward")} />
            <Field name="district" label="Quận / Huyện" autoComplete="address-level2" defaultValue={prefill?.district ?? ""} error={err("district")} />
            <Field name="province" label="Tỉnh / Thành phố" autoComplete="address-level1" required defaultValue={prefill?.province ?? ""} error={err("province")} />
          </div>
          <Field name="note" label="Ghi chú (không bắt buộc)" error={err("note")} />
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" name="save_address" defaultChecked className="size-5 accent-[var(--accent-ink)]" />
            Lưu làm địa chỉ mặc định
          </label>
        </section>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-display text-2xl font-bold uppercase">Thanh toán</legend>
          {[
            { value: "cod", title: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt cho shipper khi nhận hàng." },
            {
              value: "bank_transfer",
              title: "Chuyển khoản ngân hàng (VietQR)",
              desc: bankReady ? "Quét mã QR sau khi đặt hàng. Đơn được xác nhận khi shop nhận tiền." : "Shop sẽ gửi thông tin chuyển khoản sau khi xác nhận đơn.",
            },
          ].map((o, i) => (
            <label key={o.value} className="flex cursor-pointer gap-4 border-2 border-line p-4 has-checked:border-fg">
              <input type="radio" name="payment_method" value={o.value} defaultChecked={i === 0} className="mt-1 size-5 accent-[var(--accent-ink)]" />
              <span>
                <span className="block font-bold">{o.title}</span>
                <span className="text-sm text-muted">{o.desc}</span>
              </span>
            </label>
          ))}
          {err("payment_method") && <p className="text-sm text-danger">{err("payment_method")}</p>}
        </fieldset>
      </div>

      <aside aria-labelledby="sum-h" className="flex h-fit flex-col gap-4 border-2 border-fg p-5 lg:sticky lg:top-24">
        <h2 id="sum-h" className="text-2xl uppercase">
          Đơn hàng
        </h2>
        {notice && (
          <p role="status" className="border-l-4 border-accent-ink pl-3 text-sm">
            {notice}
          </p>
        )}
        {quoteState === "error" && (
          <p role="alert" className="text-sm text-danger">
            Không kiểm tra được tồn kho mới nhất. Kiểm tra kết nối mạng — đơn vẫn được xác minh khi đặt.
          </p>
        )}
        <ul>
          {lines.map((l) => (
            <CartLineItem key={l.variantId} line={l} />
          ))}
        </ul>
        <div className="flex justify-between">
          <span className="text-muted">Tạm tính</span>
          <span>{formatVnd(subtotal)}</span>
        </div>
        <ShippingHint subtotal={subtotal} />
        <div className="flex justify-between border-t-2 border-fg pt-4 text-xl font-bold">
          <span>Tổng cộng</span>
          <span>{formatVnd(total)}</span>
        </div>
        {state.message && (
          <p role="alert" className="border-l-4 border-danger pl-3 text-sm text-danger">
            {state.message}
          </p>
        )}
        <Button type="submit" disabled={pending || quoteState === "loading"} aria-busy={pending} className="h-14 text-base">
          {pending ? "Đang đặt hàng…" : quoteState === "loading" ? "Đang kiểm tra giỏ hàng…" : `Đặt hàng · ${formatVnd(total)}`}
        </Button>
        <p className="text-xs text-muted">Giá và phí giao hàng được xác nhận lại khi đặt hàng.</p>
      </aside>
    </form>
  );
}
