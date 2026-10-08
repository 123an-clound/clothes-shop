import type { MetadataRoute } from "next";
import { getCategories, getSitemapEntries } from "@/services/catalog";
import { getSettings } from "@/services/settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, { products }, { faq }] = await Promise.all([getCategories(), getSitemapEntries(), getSettings()]);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${SITE_URL}/shop/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/policies`, changeFrequency: "yearly", priority: 0.3 },
    ...(faq.length > 0 ? [{ url: `${SITE_URL}/faq`, changeFrequency: "monthly" as const, priority: 0.4 }] : []),
  ];
}
