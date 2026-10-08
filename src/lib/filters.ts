export const SORTS = ["new", "price-asc", "price-desc", "best"] as const;
export type Sort = (typeof SORTS)[number];

export type ShopFilters = {
  category?: string;
  sizes: string[];
  colors: string[];
  min?: number;
  max?: number;
  sort: Sort;
  page: number;
};

export type RawParams = Record<string, string | string[] | undefined>;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_VALUES = 10;

function list(v: string | string[] | undefined): string[] {
  const arr = Array.isArray(v) ? v : v === undefined ? [] : [v];
  return [...new Set(arr.map((s) => s.trim()).filter((s) => s.length > 0 && s.length <= 50))].slice(0, MAX_VALUES);
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function money(v: string | string[] | undefined): number | undefined {
  const n = Number(first(v));
  return Number.isInteger(n) && n >= 0 && n <= 100_000_000 ? n : undefined;
}

/** URL params → filters. Never throws: invalid values are dropped. Route category wins over ?cat. */
export function parseFilters(sp: RawParams, routeCategory?: string): ShopFilters {
  const cat = routeCategory ?? first(sp.cat);
  const sort = first(sp.sort);
  const page = Number(first(sp.page));
  let min = money(sp.min);
  let max = money(sp.max);
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];

  const f: ShopFilters = {
    sizes: list(sp.size),
    colors: list(sp.color),
    sort: SORTS.includes(sort as Sort) ? (sort as Sort) : "new",
    page: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  };
  if (cat && SLUG.test(cat)) f.category = cat;
  if (min !== undefined) f.min = min;
  if (max !== undefined) f.max = max;
  return f;
}

/** Filters → query string for the current path (category lives in the path, so it is omitted). */
export function filtersToSearch(f: ShopFilters): string {
  const sp = new URLSearchParams();
  f.sizes.forEach((s) => sp.append("size", s));
  f.colors.forEach((c) => sp.append("color", c));
  if (f.min !== undefined) sp.set("min", String(f.min));
  if (f.max !== undefined) sp.set("max", String(f.max));
  if (f.sort !== "new") sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(f.page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
