import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav, AdminNavStatic } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/store/theme-toggle";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s | Quản trị" },
  robots: { index: false, follow: false },
};

// Access is enforced by proxy.ts, requireAdmin() in every admin service/action, and DB RLS.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[14rem_1fr]">
      <aside className="border-b-2 border-fg lg:border-r-2 lg:border-b-0">
        <div className="flex items-center justify-between gap-2 px-4 py-4 lg:sticky lg:top-0">
          <Link href="/admin" className="font-display text-lg font-bold uppercase">
            Admin
          </Link>
          <div className="flex items-center">
            <ThemeToggle />
            <Link href="/" className="min-h-11 content-center px-2 text-xs font-bold uppercase underline underline-offset-4">
              Xem shop
            </Link>
          </div>
        </div>
        <nav aria-label="Quản trị" className="px-2 pb-3 lg:sticky lg:top-16">
          <Suspense fallback={<AdminNavStatic />}>
            <AdminNav />
          </Suspense>
        </nav>
      </aside>
      <main id="main" className="min-w-0 px-4 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
