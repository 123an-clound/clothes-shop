"use client";

import Link from "next/link";
import { useShopNav } from "./shop-shell";

/** Real links (crawlable) to each page of the current filter set. */
export function Pagination({ totalPages }: { totalPages: number }) {
  const { filters, hrefFor } = useShopNav();
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className="mt-16 flex justify-center">
      <ul className="flex flex-wrap gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <li key={p}>
            <Link
              href={hrefFor({ page: p })}
              aria-current={p === filters.page ? "page" : undefined}
              aria-label={`Trang ${p}`}
              className="grid size-11 place-items-center border-2 border-line font-bold hover:border-fg aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg"
            >
              {p}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
