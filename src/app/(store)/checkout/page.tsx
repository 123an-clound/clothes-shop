import type { Metadata } from "next";
import { Suspense } from "react";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { getMyProfile } from "@/services/orders";
import { getSettings } from "@/services/settings";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Thanh toán", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-8">
      <h1 className="mb-10 text-6xl uppercase sm:text-8xl">Thanh toán</h1>
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <Checkout />
      </Suspense>
    </div>
  );
}

async function Checkout() {
  const [prefill, { bank }] = await Promise.all([getMyProfile(), getSettings()]);
  return (
    <FreshOnNavigate>
      <CheckoutForm prefill={prefill} bankReady={Boolean(bank.bank_bin && bank.account_number)} />
    </FreshOnNavigate>
  );
}
