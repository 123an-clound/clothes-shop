import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Chính sách",
  description: "Chính sách giao hàng, đổi trả và bảo mật thông tin.",
  alternates: { canonical: "/policies" },
};

export default async function PoliciesPage() {
  const { policies } = await getSettings();
  const sections = [
    { id: "shipping", title: "Giao hàng", body: policies.shipping },
    { id: "returns", title: "Đổi trả", body: policies.returns },
    { id: "privacy", title: "Bảo mật", body: policies.privacy },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <Breadcrumbs items={[{ name: "Chính sách", href: "/policies" }]} />
      <h1 className="mb-12 text-6xl uppercase sm:text-8xl">Chính sách</h1>
      <div className="flex flex-col gap-12">
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24 border-t-2 border-fg pt-6">
            <h2 id={`${s.id}-h`} className="mb-4 text-3xl uppercase">
              {s.title}
            </h2>
            <p className="whitespace-pre-line text-muted">{s.body || "Đang cập nhật."}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
