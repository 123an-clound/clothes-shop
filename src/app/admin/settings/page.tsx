import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/form";
import { requireAdmin } from "@/services/auth";
import { getSettings } from "@/services/settings";
import { BankForm, FaqForm, PoliciesForm, SeoForm, ShippingForm, StoreForm } from "./settings-forms";

export const metadata: Metadata = { title: "Cài đặt" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Cài đặt" />
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <StoreForm initial={s.store} />
      <SeoForm initial={s.seo} />
      <ShippingForm initial={s.shipping} />
      <BankForm initial={s.bank} />
      <div className="2xl:col-span-2">
        <FaqForm initial={s.faq} />
      </div>
      <div className="2xl:col-span-2">
        <PoliciesForm initial={s.policies} />
      </div>
    </div>
  );
}
