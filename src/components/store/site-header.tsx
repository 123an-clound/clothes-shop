import Image from "next/image";
import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { UserIcon } from "@/components/icons";
import { getCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const [{ store, theme }, categories] = await Promise.all([getSettings(), getCategories()]);
  const nav = [{ href: "/shop", label: "Tất cả" }, ...categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.name }))];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl backdrop-saturate-150">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        Bỏ qua tới nội dung
      </a>
      <div className="relative mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-8">
        <MobileMenu items={nav} />
        <Link href="/" className="font-display text-xl font-bold tracking-tight uppercase" aria-label={`${store.name} — trang chủ`}>
          {theme.logo_url ? (
            // Admin may paste any https logo URL; skip the optimizer so it need not be in remotePatterns.
            <Image src={theme.logo_url} alt="" width={120} height={32} className="h-8 w-auto" loading="eager" unoptimized />
          ) : (
            store.name
          )}
        </Link>
        <nav aria-label="Danh mục" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="relative flex min-h-11 items-center px-3 text-sm font-bold tracking-wider uppercase after:absolute after:inset-x-3 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 hover:after:scale-x-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center lg:ml-0">
          <ThemeToggle />
          <Link href="/account" aria-label="Tài khoản" className="grid size-11 place-items-center hover:text-accent-ink">
            <UserIcon />
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
