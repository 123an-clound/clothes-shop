import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { Marquee } from "@/components/store/marquee";
import { BLUR, ProductGrid } from "@/components/store/product-card";
import { Reveal } from "@/components/store/reveal";
import { formatVnd } from "@/lib/money";
import { getCategories, getHomeSections, type ProductCard } from "@/services/catalog";
import { getSettings } from "@/services/settings";

export default async function HomePage() {
  const [{ store, banners, shipping }, categories, sections] = await Promise.all([
    getSettings(),
    getCategories(),
    getHomeSections(),
  ]);
  const [hero, secondary] = banners;
  const featuredCats = categories.filter((c) => c.isFeatured).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-end overflow-hidden bg-[#0a0a0a]">
        {hero?.image_url && (
          <Image
            src={hero.image_url}
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLUR}
            className="-z-20 object-cover"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/40 to-black/10" aria-hidden="true" />
        <div className="mx-auto w-full max-w-screen-2xl px-4 pb-12 text-[#f5f5f0] sm:px-8 sm:pb-20">
          <p className="mb-4 inline-block bg-accent px-3 py-1 text-xs font-bold tracking-[0.25em] text-on-accent uppercase">
            {store.name}
          </p>
          <h1 className="max-w-5xl text-[clamp(3rem,11vw,10rem)] leading-[0.85] uppercase">
            {hero?.title || store.tagline}
          </h1>
          {hero?.subtitle && <p className="mt-6 max-w-xl text-lg text-white/80">{hero.subtitle}</p>}
          <Link href={hero?.cta_href || "/shop"} className={buttonClass("primary", "mt-8 h-14 px-8 text-base")}>
            {hero?.cta_label || "Mua ngay"}
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      <Marquee
        items={[
          `Freeship từ ${formatVnd(shipping.free_threshold)}`,
          "Đổi trả 7 ngày",
          "Drop mới mỗi tuần",
          "COD & chuyển khoản",
        ]}
      />

      {/* Featured categories: asymmetric bento */}
      {featuredCats.length > 0 && (
        <section aria-labelledby="cat-heading" className="mx-auto w-full max-w-screen-2xl px-4 pt-24 sm:px-8">
          <SectionHeading id="cat-heading" title="Danh mục" href="/shop" linkLabel="Xem tất cả" />
          <ul className="grid auto-rows-[minmax(14rem,1fr)] grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 sm:gap-5">
            {featuredCats.map((c, i) => (
              <Reveal as="li" key={c.id} className={i === 0 ? "col-span-2 row-span-2" : i === 3 ? "col-span-2" : ""}>
                <Link href={`/shop/${c.slug}`} className="group relative isolate flex h-full min-h-56 items-end overflow-hidden rounded-box bg-[#0a0a0a] p-5">
                  {c.imageUrl && (
                    <Image
                      src={c.imageUrl}
                      alt=""
                      fill
                      sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                      placeholder="blur"
                      blurDataURL={BLUR}
                      className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 to-transparent" aria-hidden="true" />
                  <span className="flex items-center gap-2 font-display text-2xl font-bold text-[#f5f5f0] uppercase sm:text-4xl">
                    {c.name}
                    <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <ProductRail id="new-heading" title="Mới về" href="/shop?sort=new" products={sections.newest} />
      <ProductRail id="best-heading" title="Bán chạy" href="/shop?sort=best" products={sections.best} />

      {/* Secondary banner: split layout */}
      {secondary?.image_url && (
        <section aria-labelledby="drop-heading" className="mx-auto mt-24 grid w-full max-w-screen-2xl gap-0 px-4 sm:px-8 md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden md:aspect-auto md:min-h-[36rem]">
            <Image src={secondary.image_url} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" placeholder="blur" blurDataURL={BLUR} className="object-cover" />
          </div>
          <Reveal className="flex flex-col justify-center gap-6 bg-accent p-8 text-on-accent sm:p-14">
            <h2 id="drop-heading" className="text-5xl uppercase sm:text-7xl">{secondary.title}</h2>
            {secondary.subtitle && <p className="max-w-md text-lg">{secondary.subtitle}</p>}
            <Link href={secondary.cta_href} className="inline-flex min-h-11 w-fit items-center gap-2 border-2 border-on-accent px-6 font-bold tracking-wider uppercase transition-colors hover:bg-on-accent hover:text-accent">
              {secondary.cta_label || "Khám phá"}
              <ArrowRightIcon />
            </Link>
          </Reveal>
        </section>
      )}
    </>
  );
}

function SectionHeading({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-fg pb-4">
      <h2 id={id} className="text-4xl uppercase sm:text-6xl">
        {title}
      </h2>
      <Link href={href} className="flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold tracking-wider uppercase hover:text-accent-ink">
        {linkLabel}
        <ArrowRightIcon />
      </Link>
    </div>
  );
}

function ProductRail({ id, title, href, products }: { id: string; title: string; href: string; products: ProductCard[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mx-auto w-full max-w-screen-2xl px-4 pt-24 sm:px-8">
      <SectionHeading id={id} title={title} href={href} linkLabel="Xem thêm" />
      <Reveal>
        <ProductGrid products={products} />
      </Reveal>
    </section>
  );
}
