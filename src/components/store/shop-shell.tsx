"use client";

import { createContext, use, useTransition } from "react";
import { useRouter } from "next/navigation";
import { filtersToSearch, type ShopFilters } from "@/lib/filters";

type ShopNav = {
  filters: ShopFilters;
  apply: (next: Partial<ShopFilters>) => void;
  hrefFor: (next: Partial<ShopFilters>) => string;
  isPending: boolean;
};

const ShopNavContext = createContext<ShopNav | null>(null);

export function useShopNav() {
  const ctx = use(ShopNavContext);
  if (!ctx) throw new Error("useShopNav must be used inside <ShopShell>");
  return ctx;
}

/**
 * Owns URL updates for the listing. Filters change the URL via router.replace inside a transition,
 * so the server re-renders results without a full reload while the current grid stays visible (dimmed).
 */
export function ShopShell({ filters, basePath, children }: { filters: ShopFilters; basePath: string; children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Any filter change returns to page 1 unless the caller sets the page explicitly.
  const hrefFor = (next: Partial<ShopFilters>) => `${basePath}${filtersToSearch({ ...filters, page: 1, ...next })}`;

  function apply(next: Partial<ShopFilters>) {
    startTransition(() => router.replace(hrefFor(next), { scroll: false }));
  }

  return (
    <ShopNavContext value={{ filters, apply, hrefFor, isPending }}>
      <div data-pending={isPending || undefined} className="group/shop" aria-busy={isPending}>
        {children}
      </div>
    </ShopNavContext>
  );
}
