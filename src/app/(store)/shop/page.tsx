import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { ShopResults, ShopSkeleton } from "@/components/store/shop-results";

export const metadata: Metadata = {
  title: "Tất cả sản phẩm",
  description: "Toàn bộ áo thun, hoodie, áo khoác, quần và phụ kiện streetwear. Lọc theo size, màu và giá.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-12 sm:px-8">
      <Breadcrumbs items={[{ name: "Sản phẩm", href: "/shop" }]} />
      <h1 className="mb-10 text-6xl uppercase sm:text-8xl">Tất cả</h1>
      <Suspense fallback={<ShopSkeleton />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
