import Link from "next/link";
import { getCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";

export async function SiteFooter() {
  const [{ store }, categories] = await Promise.all([getSettings(), getCategories()]);
  const socials = [
    { href: store.facebook, label: "Facebook" },
    { href: store.instagram, label: "Instagram" },
    { href: store.tiktok, label: "TikTok" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 border-t-2 border-fg">
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-4 py-16 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-5xl font-bold uppercase sm:text-7xl">{store.name}</p>
          <p className="mt-4 max-w-md text-muted">{store.tagline}</p>
        </div>
        <nav aria-label="Danh mục sản phẩm">
          <p className="mb-4 text-xs font-bold tracking-widest text-muted uppercase">Mua sắm</p>
          <ul className="flex flex-col gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop/${c.slug}`} className="hover:text-accent-ink">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="mb-4 text-xs font-bold tracking-widest text-muted uppercase">Hỗ trợ</p>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/faq" className="hover:text-accent-ink">Câu hỏi thường gặp</Link>
            </li>
            <li>
              <Link href="/policies#shipping" className="hover:text-accent-ink">Giao hàng</Link>
            </li>
            <li>
              <Link href="/policies#returns" className="hover:text-accent-ink">Đổi trả</Link>
            </li>
            <li>
              <Link href="/policies#privacy" className="hover:text-accent-ink">Bảo mật</Link>
            </li>
            {store.email && (
              <li>
                <a href={`mailto:${store.email}`} className="hover:text-accent-ink">{store.email}</a>
              </li>
            )}
            {store.phone && (
              <li>
                <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="hover:text-accent-ink">{store.phone}</a>
              </li>
            )}
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-4 py-6 text-center text-xs text-muted">
        © {store.name}. {store.address}
      </p>
    </footer>
  );
}
