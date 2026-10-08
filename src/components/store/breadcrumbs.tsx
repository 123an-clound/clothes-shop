import Link from "next/link";
import { JsonLd } from "@/components/json-ld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type Crumb = { name: string; href: string };

/** Visible trail + BreadcrumbList JSON-LD. The last crumb is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const crumbs = [{ name: "Trang chủ", href: "/" }, ...items];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE_URL}${c.href}` })),
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((c, i) => (
            <li key={c.href} className="flex items-center gap-2">
              {i < crumbs.length - 1 ? (
                <>
                  <Link href={c.href} className="hover:text-fg">
                    {c.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              ) : (
                <span aria-current="page" className="text-fg">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
