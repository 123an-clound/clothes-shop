import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { ShopResults, ShopSkeleton } from "@/components/store/shop-results";
import { getCategories } from "@/services/catalog";

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ category: c.slug }));
}

async function findCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = await findCategory(category);
  if (!cat) return {};
  return {
    title: cat.name,
    description: cat.description || `Mua ${cat.name} streetwear chính hãng, giao hàng toàn quốc.`,
    alternates: { canonical: `/shop/${cat.slug}` },
    openGraph: cat.imageUrl ? { images: [cat.imageUrl] } : undefined,
  };
}

// params are read inside <Suspense> so the generic App Shell (unknown slugs, runtime revalidation) can prerender.
export default function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-12 sm:px-8">
      <Suspense fallback={<ShopSkeleton />}>
        <CategoryContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/shop/[category]">, "params" | "searchParams">) {
  const { category } = await params;
  const cat = await findCategory(category);
  if (!cat) notFound();

  return (
    <>
      <Breadcrumbs items={[{ name: "Sản phẩm", href: "/shop" }, { name: cat.name, href: `/shop/${cat.slug}` }]} />
      <h1 className="text-6xl uppercase sm:text-8xl">{cat.name}</h1>
      {cat.description && <p className="mt-4 mb-10 max-w-xl text-muted">{cat.description}</p>}
      <Suspense fallback={<ShopSkeleton />}>
        <ShopResults searchParams={searchParams} category={cat.slug} />
      </Suspense>
    </>
  );
}
