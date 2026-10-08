# Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public storefront — home, `/shop` with instant faceted filters, `/shop/[category]`, `/products/[slug]` PDP with variant picker — plus site chrome (header/footer/theme toggle), motion, and SEO (metadata, JSON-LD, sitemap, robots).

**Architecture:** Server Components read the catalog through `src/services/catalog.ts` (`'use cache'` + `cacheTag('catalog')`, cookie-less anon client so RLS only exposes published data). Filters live in the URL; `parseFilters()` is the single source of truth for both server query and client UI. Client islands only where interaction is needed (filter panel, gallery, variant picker, theme toggle, smooth scroll).

**Tech Stack:** Next.js 16 (cacheComponents), Supabase, Zod 4, Tailwind 4, Motion 14, Lenis 1.3.

**Spec:** `docs/superpowers/specs/2026-10-07-clothes-shop-design.md` (§4 Storefront, §5 SEO)

## Global Constraints

- Only published products are ever visible (enforced by RLS; services use `createPublicClient()`).
- Filter params: `cat`, `size` (repeatable), `color` (repeatable), `min`, `max`, `sort` ∈ `new|price-asc|price-desc|best`, `page` ≥ 1. Invalid values are dropped, never thrown.
- Page size 12. Images via `next/image` (remotePatterns: `images.unsplash.com`, project Supabase storage), lazy + blur placeholder, explicit `sizes`.
- Every page: exactly one `<h1>`, `generateMetadata` with canonical; JSON-LD serialized with `<` → `<`.
- Motion respects `prefers-reduced-motion`. Touch targets ≥ 44px. Mobile-first.
- "Thêm vào giỏ" is wired in the Cart & Checkout plan; this plan renders variant selection + stock only.

---

### Task 1: Filter parsing (TDD)
**Files:** `src/lib/filters.ts`, `src/lib/filters.test.ts`
**Produces:** `type ShopFilters = { category?: string; sizes: string[]; colors: string[]; min?: number; max?: number; sort: Sort; page: number }`, `parseFilters(sp: Record<string, string | string[] | undefined>, category?: string): ShopFilters`, `filtersToSearch(f: ShopFilters): string` (stable key order, omits defaults).
- [ ] Tests: drops invalid sort/page/negative price, swaps min>max, dedupes sizes, round-trips through `filtersToSearch`.
- [ ] Implement → `npm test` PASS → commit.

### Task 2: Catalog service
**Files:** `src/services/catalog.ts`, `next.config.ts` (images + security headers)
**Produces:**
- `getCategories(): Promise<Category[]>`
- `getHomeSections(): Promise<{ featured: ProductCard[]; newest: ProductCard[]; best: ProductCard[] }>`
- `listProducts(f: ShopFilters): Promise<{ items: ProductCard[]; total: number }>`
- `getFacets(category?: string): Promise<{ sizes: string[]; colors: { name: string; hex: string }[]; minPrice: number; maxPrice: number }>`
- `getProductBySlug(slug): Promise<ProductDetail | null>`, `getAllProductSlugs(): Promise<string[]>`
- `ProductCard = { id, slug, name, price, compareAtPrice, images: {url, alt}[] (≤2), soldOut: boolean }`
- All `'use cache'`, `cacheTag('catalog')`, `cacheLife('hours')`. Select only needed columns. Size/color filters use `cs_variants!inner` with `stock > 0`.
- [ ] Implement; verify via a temporary server page or build; commit.

### Task 3: Site chrome + motion
**Files:** `src/app/(store)/layout.tsx`, `src/components/store/{site-header,site-footer,theme-toggle,smooth-scroll,reveal,marquee}.tsx`; move `src/app/page.tsx` → `src/app/(store)/page.tsx`; move `account` under `(store)`.
- Header: sticky glass bar, logo/brand, category nav (desktop), mobile menu (`<details>`-free accessible disclosure button), account link, theme toggle. Footer: store info, socials, policies.
- Lenis smooth scroll (disabled on reduced motion), `Reveal` (Motion `whileInView`, reduced-motion → static).
- [ ] build PASS; commit.

### Task 4: Home page
Hero from `settings.banners[0]` (full-bleed image, giant type, CTA), marquee strip, featured categories grid, "Mới về" + "Bán chạy" product rails, banner #2 split section.
- [ ] build PASS; commit.

### Task 5: Shop listing + filters
**Files:** `src/app/(store)/shop/page.tsx`, `src/app/(store)/shop/[category]/page.tsx` (`generateStaticParams` from categories), `src/components/store/{product-card,product-grid,filter-panel,sort-select,pagination}.tsx`
- Filter panel: client; updates URL with `router.replace(url, { scroll: false })` inside `useTransition`; grid shows pending opacity; mobile = bottom sheet dialog with focus trap via `<dialog>`.
- Empty state with "Xoá bộ lọc".
- [ ] build PASS; commit.

### Task 6: Product detail page
**Files:** `src/app/(store)/products/[slug]/page.tsx` (+ `generateStaticParams`, `notFound()`), `src/components/store/{product-gallery,variant-picker}.tsx`
- Gallery: main image + thumbnails, keyboard accessible; switches to color image if `color` set.
- Variant picker: color swatches + size buttons (sold-out disabled + strikethrough), shows price (variant override) and stock text ("Còn 3 sản phẩm" / "Hết hàng").
- JSON-LD `Product` (offers per variant availability) + `BreadcrumbList`.
- [ ] build PASS; commit.

### Task 7: SEO plumbing + error states
**Files:** `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/not-found.tsx`, `src/app/(store)/error.tsx`, `loading.tsx` skeletons, Organization JSON-LD in store layout.
- robots: disallow `/admin`, `/account`, `/checkout`, `/orders`, `/auth`; sitemap: home, shop, categories, products.
- [ ] build PASS; commit.

### Task 8: Verification
- [ ] lint, typecheck, test, build PASS.
- [ ] Playwright (prod server): home renders hero + rails; `/shop` filter by size updates URL without full reload and result count changes; sold-out size disabled on PDP; mobile 390px no horizontal scroll; axe 0 serious on home/shop/PDP (dark + light).
- [ ] Commit `chore: storefront verified`.
