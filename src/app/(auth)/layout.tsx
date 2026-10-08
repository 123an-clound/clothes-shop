import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-16">
      <Link href="/" className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted hover:text-fg">
        ← Trang chủ
      </Link>
      {children}
    </main>
  );
}
