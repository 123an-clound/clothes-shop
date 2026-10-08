import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { getSettings } from "@/services/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { faq } = await getSettings();
  return {
    title: "Câu hỏi thường gặp",
    description: "Giải đáp về size, giao hàng, đổi trả và thanh toán.",
    alternates: { canonical: "/faq" },
    // An empty FAQ page is thin content: keep it out of the index until the admin adds questions.
    robots: faq.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function FaqPage() {
  const { faq } = await getSettings();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <Breadcrumbs items={[{ name: "Câu hỏi thường gặp", href: "/faq" }]} />
      <h1 className="mb-12 text-5xl uppercase sm:text-7xl">Câu hỏi thường gặp</h1>
      {faq.length === 0 ? (
        <p className="text-muted">Nội dung đang được cập nhật.</p>
      ) : (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            }}
          />
          <div className="border-t-2 border-fg">
            {faq.map((f, i) => (
              <details key={i} className="group border-b border-line">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold">
                  <h2 className="font-sans text-lg tracking-normal">{f.q}</h2>
                  <span aria-hidden="true" className="text-2xl transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-6 whitespace-pre-line text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
