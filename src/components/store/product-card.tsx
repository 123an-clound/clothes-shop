import Image from "next/image";
import Link from "next/link";
import { formatVnd } from "@/lib/money";
import type { ProductCard as Card } from "@/services/catalog";

// Neutral 4:5 blur placeholder; remote images have no build-time blurDataURL.
export const BLUR =
  "data:image/svg+xml;base64," +
  "PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA0IDUnPjxyZWN0IHdpZHRoPSc0JyBoZWlnaHQ9JzUnIGZpbGw9JyMyMjInLz48L3N2Zz4=";

export function ProductCard({ product, priority = false }: { product: Card; priority?: boolean }) {
  const [first, second] = product.images;
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw";

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-box bg-surface">
        {first && (
          <Image
            src={first.url}
            alt={first.alt || product.name}
            fill
            sizes={sizes}
            placeholder="blur"
            blurDataURL={BLUR}
            loading={priority ? "eager" : undefined}
            className={`object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] ${second ? "pointer-fine:group-hover:opacity-0" : ""}`}
          />
        )}
        {second && (
          <Image
            src={second.url}
            alt=""
            fill
            sizes={sizes}
            // Hover-only image: display:none on touch devices, so the lazy image is never fetched there.
            className="hidden object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 pointer-fine:block"
          />
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {product.soldOut && <span className="bg-fg px-2 py-1 text-xs font-bold text-bg uppercase">Hết hàng</span>}
          {!product.soldOut && onSale && (
            <span className="bg-accent px-2 py-1 text-xs font-bold text-on-accent uppercase">
              -{Math.round((1 - product.price / product.compareAtPrice!) * 100)}%
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-sm leading-snug font-bold tracking-normal uppercase group-hover:underline group-hover:underline-offset-4">
          {product.name}
        </h3>
        <p className="flex flex-wrap items-baseline gap-2 text-sm">
          <span className="font-bold">{formatVnd(product.price)}</span>
          {onSale && (
            <s className="text-muted">
              <span className="sr-only">Giá gốc </span>
              {formatVnd(product.compareAtPrice!)}
            </s>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Card[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4 sm:gap-x-5">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
