// Image hosts allowed by next.config.ts remotePatterns. Anything else would break next/image (and is untrusted).
const SUPABASE_HOST = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co").hostname;
export const STORAGE_BUCKET = "cs-products";
export const STORAGE_PREFIX = `https://${SUPABASE_HOST}/storage/v1/object/public/${STORAGE_BUCKET}/`;

export function isTrustedImageUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.hostname === "images.unsplash.com") return url.pathname.startsWith("/photo-");
  return url.hostname === SUPABASE_HOST && url.pathname.startsWith(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
}

/** Object path inside the bucket for one of our storage URLs, else null (e.g. Unsplash seed images). */
export function storagePathOf(url: string): string | null {
  return url.startsWith(STORAGE_PREFIX) ? decodeURIComponent(url.slice(STORAGE_PREFIX.length).split("?")[0]) : null;
}
