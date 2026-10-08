import Link from "next/link";
import { parseFilters, type RawParams } from "@/lib/filters";
import { getFacets, listProducts, PAGE_SIZE } from "@/services/catalog";
import { ClearFilters, FilterPanel, SortSelect } from "./filter-panel";
import { Pagination } from "./pagination";
import { ProductGrid } from "./product-card";
import { ShopShell } from "./shop-shell";

/** Reads searchParams (runtime data): render inside <Suspense>. */
export async function ShopResults({ searchParams, category }: { searchParams: Promise<RawParams>; category?: string }) {
  const filters = parseFilters(await searchParams, category);
  const [{ items, total }, facets] = await Promise.all([listProducts(filters), getFacets(filters.category)]);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const basePath = category ? `/shop/${category}` : "/shop";

  return (
    <ShopShell filters={filters} basePath={basePath}>
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
        <FilterPanel facets={facets} total={total} />
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <p className="text-sm text-muted" aria-live="polite">
              {total} sản phẩm
            </p>
            <SortSelect />
          </div>
          <h2 className="sr-only">Danh sách sản phẩm</h2>
          {items.length > 0 ? (
            <div className="transition-opacity duration-200 group-data-pending/shop:opacity-40">
              <ProductGrid products={items} priorityCount={4} />
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 border-2 border-dashed border-line p-10">
              <p className="font-display text-3xl font-bold uppercase">Không tìm thấy sản phẩm</p>
              <p className="text-muted">Thử bỏ bớt bộ lọc hoặc xem tất cả sản phẩm.</p>
              <div className="flex flex-wrap items-center gap-4">
                <ClearFilters />
                <Link href="/shop" className="min-h-11 content-center text-sm font-bold underline underline-offset-4">
                  Xem tất cả
                </Link>
              </div>
            </div>
          )}
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </ShopShell>
  );
}

export function ShopSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12" aria-hidden="true">
      <div className="hidden h-80 animate-pulse bg-surface lg:block" />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4 sm:gap-x-5">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="flex flex-col gap-3">
            <div className="aspect-[4/5] animate-pulse bg-surface" />
            <div className="h-4 w-3/4 animate-pulse bg-surface" />
            <div className="h-4 w-1/3 animate-pulse bg-surface" />
          </li>
        ))}
      </ul>
    </div>
  );
}
