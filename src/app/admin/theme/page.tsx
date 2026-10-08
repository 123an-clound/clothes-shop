import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/form";
import { requireAdmin } from "@/services/auth";
import { getSettings } from "@/services/settings";
import { BannerEditor } from "./banner-editor";
import { ThemeEditor } from "./theme-editor";

export const metadata: Metadata = { title: "Giao diện" };

export default function ThemePage() {
  return (
    <>
      <PageHeader title="Giao diện" />
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <ThemeContent />
      </Suspense>
    </>
  );
}

async function ThemeContent() {
  await requireAdmin();
  const { theme, banners } = await getSettings();
  return (
    <div className="flex flex-col gap-16">
      <ThemeEditor initial={theme} />
      <section aria-labelledby="banners-h">
        <h2 id="banners-h" className="mb-6 border-b-2 border-fg pb-3 text-3xl uppercase">
          Banner trang chủ
        </h2>
        <BannerEditor initial={banners} />
      </section>
    </div>
  );
}
