"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/categories", label: "Danh mục" },
  { href: "/admin/theme", label: "Giao diện" },
  { href: "/admin/settings", label: "Cài đặt" },
];

const linkClass =
  "flex min-h-11 shrink-0 items-center px-3 text-sm font-bold tracking-wider uppercase hover:bg-surface aria-[current=page]:bg-fg aria-[current=page]:text-bg";

export function AdminNav() {
  const pathname = usePathname();
  const isCurrent = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  return <NavList isCurrent={isCurrent} />;
}

/** Same links without route highlighting; used as the Suspense fallback (pathname is runtime data). */
export function AdminNavStatic() {
  return <NavList isCurrent={() => false} />;
}

function NavList({ isCurrent }: { isCurrent: (href: string) => boolean }) {
  return (
    <ul className="flex gap-1 overflow-x-auto lg:flex-col">
      {ADMIN_LINKS.map((l) => (
        <li key={l.href}>
          <Link href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined} className={linkClass}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
