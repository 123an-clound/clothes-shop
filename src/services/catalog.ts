import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { ShopFilters } from "@/lib/filters";

export const CATALOG_TAG = "catalog";
export const PAGE_SIZE = 12;
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "Free"];

export type Category = { id: string; slug: string; name: string; description: string; imageUrl: string | null; isFeatured: boolean };
export type ProductImage = { url: string; alt: string; color: string | null };
export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  images: ProductImage[];
  soldOut: boolean;
};
export type Variant = { id: string; size: string; color: string; colorHex: string; price: number; stock: number };
export type ProductDetail = Omit<ProductCard, "soldOut"> & {
  description: string;
  category: { slug: string; name: string } | null;
  variants: Variant[];
  updatedAt: string;
};
export type Facets = { sizes: string[]; colors: { name: string; hex: string }[] };

// Card shape shared by every listing query. images/variants are embedded in one round trip (no N+1).
const CARD_SELECT = "id, slug, name, price, compare_at_price, cs_product_images(url, alt, color, sort_order), cs_variants(stock)";

type CardRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  cs_product_images: { url: string; alt: string; color: string | null; sort_order: number }[];
  cs_variants: { stock: number }[];
};

function toCard(r: CardRow): ProductCard {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    price: r.price,
    compareAtPrice: r.compare_at_price,
    images: [...r.cs_product_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, 2)
      .map(({ url, alt, color }) => ({ url, alt, color })),
    soldOut: r.cs_variants.every((v) => v.stock <= 0),
  };
}

function sizeRank(s: string) {
  const i = SIZE_ORDER.indexOf(s);
  return i === -1 ? SIZE_ORDER.length : i;
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("cs_categories")
    .select("id, slug, name, description, image_url, is_featured")
    .order("sort_order");
  if (error) throw new Error(`categories: ${error.message}`);
  return data.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.image_url,
    isFeatured: c.is_featured,
  }));
}

export async function getHomeSections(): Promise<{ featured: ProductCard[]; newest: ProductCard[]; best: ProductCard[] }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const db = createPublicClient();
  const base = () => db.from("cs_products").select(CARD_SELECT).eq("is_published", true).limit(8);
  const [featured, newest, best] = await Promise.all([
    base().eq("is_featured", true).order("created_at", { ascending: false }),
    base().order("created_at", { ascending: false }),
    base().order("sold_count", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  for (const r of [featured, newest, best]) if (r.error) throw new Error(`home: ${r.error.message}`);
  return {
    featured: (featured.data as CardRow[]).map(toCard),
    newest: (newest.data as CardRow[]).map(toCard),
    best: (best.data as CardRow[]).map(toCard),
  };
}

export async function listProducts(f: ShopFilters): Promise<{ items: ProductCard[]; total: number }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  let categoryId: string | undefined;
  if (f.category) {
    categoryId = (await getCategories()).find((c) => c.slug === f.category)?.id;
    if (!categoryId) return { items: [], total: 0 };
  }

  const variantFilter = f.sizes.length > 0 || f.colors.length > 0;
  // A second, inner-joined alias of cs_variants filters products without trimming the soldOut data.
  const select = variantFilter ? `${CARD_SELECT}, match:cs_variants!inner(size, color, stock)` : CARD_SELECT;

  let q = createPublicClient().from("cs_products").select(select, { count: "exact" }).eq("is_published", true);
  if (categoryId) q = q.eq("category_id", categoryId);
  if (f.min !== undefined) q = q.gte("price", f.min);
  if (f.max !== undefined) q = q.lte("price", f.max);
  if (variantFilter) {
    q = q.gt("match.stock", 0);
    if (f.sizes.length) q = q.in("match.size", f.sizes);
    if (f.colors.length) q = q.in("match.color", f.colors);
  }

  q =
    f.sort === "price-asc"
      ? q.order("price", { ascending: true })
      : f.sort === "price-desc"
        ? q.order("price", { ascending: false })
        : f.sort === "best"
          ? q.order("sold_count", { ascending: false })
          : q.order("created_at", { ascending: false });

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, error, count } = await q.order("id").range(from, from + PAGE_SIZE - 1);
  // PostgREST returns 416 (PGRST103) when the page is past the end: treat as empty.
  if (error?.code === "PGRST103") return { items: [], total: count ?? 0 };
  if (error) throw new Error(`listProducts: ${error.message}`);
  return { items: (data as unknown as CardRow[]).map(toCard), total: count ?? 0 };
}

/** In-stock sizes and colors for the filter panel, scoped to a category when given. */
export async function getFacets(categorySlug?: string): Promise<Facets> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  let q = createPublicClient()
    .from("cs_variants")
    .select("size, color, color_hex, cs_products!inner(category_id, is_published)")
    .gt("stock", 0)
    .eq("cs_products.is_published", true);
  if (categorySlug) {
    const id = (await getCategories()).find((c) => c.slug === categorySlug)?.id;
    if (!id) return { sizes: [], colors: [] };
    q = q.eq("cs_products.category_id", id);
  }
  const { data, error } = await q;
  if (error) throw new Error(`facets: ${error.message}`);

  const sizes = [...new Set(data.map((v) => v.size))].sort((a, b) => sizeRank(a) - sizeRank(b));
  const colors = new Map<string, string>();
  data.forEach((v) => colors.has(v.color) || colors.set(v.color, v.color_hex));
  return {
    sizes,
    colors: [...colors].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name, "vi")),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("cs_products")
    .select(
      "id, slug, name, description, price, compare_at_price, updated_at, cs_categories(slug, name), " +
        "cs_product_images(url, alt, color, sort_order), cs_variants(id, size, color, color_hex, price, stock)",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`product: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    compare_at_price: number | null;
    updated_at: string;
    cs_categories: { slug: string; name: string } | null;
    cs_product_images: { url: string; alt: string; color: string | null; sort_order: number }[];
    cs_variants: { id: string; size: string; color: string; color_hex: string; price: number | null; stock: number }[];
  };

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    updatedAt: row.updated_at,
    category: row.cs_categories,
    images: [...row.cs_product_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ url, alt, color }) => ({ url, alt, color })),
    variants: row.cs_variants
      .map((v) => ({ id: v.id, size: v.size, color: v.color, colorHex: v.color_hex, price: v.price ?? row.price, stock: v.stock }))
      .sort((a, b) => a.color.localeCompare(b.color, "vi") || sizeRank(a.size) - sizeRank(b.size)),
  };
}

export async function getSitemapEntries(): Promise<{ products: { slug: string; updatedAt: string }[] }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("cs_products")
    .select("slug, updated_at")
    .eq("is_published", true);
  if (error) throw new Error(`sitemap: ${error.message}`);
  return { products: data.map((p) => ({ slug: p.slug, updatedAt: p.updated_at })) };
}
