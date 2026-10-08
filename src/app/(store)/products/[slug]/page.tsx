import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { ProductView } from "@/components/store/product-view";
import { formatVnd } from "@/lib/money";
import { getProductBySlug, getSitemapEntries } from "@/services/catalog";
import { getSettings } from "@/services/settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  return (await getSitemapEntries()).products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const description = product.description.slice(0, 155) || `${product.name} — ${formatVnd(product.price)}`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { type: "website", title: product.name, description, images: product.images.slice(0, 1).map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, { store, policies, shipping }] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const url = `${SITE_URL}/products/${product.slug}`;
  const crumbs = [
    ...(product.category ? [{ name: product.category.name, href: `/shop/${product.category.slug}` }] : []),
    { name: product.name, href: `/products/${product.slug}` },
  ];

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.images.map((i) => i.url),
          brand: { "@type": "Brand", name: store.name },
          offers: product.variants.map((v) => ({
            "@type": "Offer",
            url,
            priceCurrency: "VND",
            price: v.price,
            availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            name: `${v.color} / ${v.size}`,
          })),
        }}
      />
      <Breadcrumbs items={crumbs} />

      <ProductView product={product}>
        <div className="flex flex-col gap-6 border-t-2 border-fg pt-8">
          <div>
            <h2 className="mb-3 text-xl uppercase">Mô tả</h2>
            <p className="whitespace-pre-line text-muted">{product.description}</p>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <strong>Giao hàng:</strong> {formatVnd(shipping.flat_fee)}/đơn — miễn phí từ {formatVnd(shipping.free_threshold)}.
            </li>
            {policies.returns && (
              <li>
                <strong>Đổi trả:</strong> {policies.returns}
              </li>
            )}
          </ul>
        </div>
      </ProductView>
    </div>
  );
}
