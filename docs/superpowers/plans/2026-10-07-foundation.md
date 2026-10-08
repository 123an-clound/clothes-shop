# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js app, create the full `cs_*` database (schema, RLS, order functions, storage), wire Supabase auth (customer + admin guard), base design tokens, auth pages, and seed data — so the storefront, checkout and admin plans can build on it.

**Architecture:** Next.js 16 App Router; all DB access goes through `src/services/*` (server-only) using `@supabase/ssr` clients that carry the user session, so RLS always applies. Writes that touch money/stock run inside Postgres `security definer` functions. `proxy.ts` refreshes the session and gates `/admin`, `/checkout`, `/account`.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, Tailwind CSS 4.3, `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.117, Zod 4, Motion 14, Lenis 1.3, Vitest 5, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-07-clothes-shop-design.md`

## Global Constraints

- Supabase project `jtizooyjnllostamffpp` (shared with other sites). Every table/function/type/bucket is prefixed `cs_` / `cs-`. Never touch non-`cs_` objects.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public); `SUPABASE_SERVICE_ROLE_KEY` only in `.env.local` for `scripts/seed.ts`, never imported by `src/`.
- Server-side auth checks use `supabase.auth.getClaims()` / `getUser()`, never `getSession()`.
- Money = integer VND. Phone format `^0[0-9]{9}$`.
- All UI copy in Vietnamese; code/identifiers/comments in English.
- Windows + PowerShell for commands.

---

### Task 1: Scaffold Next.js app

**Files:** Create: project files via `create-next-app`, `.env.local`, `.env.example`, `vitest.config.ts`.

- [ ] **Step 1:** Scaffold into a temp dir (create-next-app refuses non-empty dirs containing `plan.md`) and move files in:
```powershell
npx create-next-app@16.4.0 C:\Temp\cs-scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-npm --yes
robocopy C:\Temp\cs-scaffold . /E /XD node_modules .git /NFL /NDL /NJH /NJS; npm install
```
- [ ] **Step 2:** Install deps:
```powershell
npm i @supabase/ssr @supabase/supabase-js zod motion lenis server-only
npm i -D vitest tsx dotenv
```
- [ ] **Step 3:** `.env.example` (committed) and `.env.local` (gitignored) with:
```
NEXT_PUBLIC_SUPABASE_URL=https://jtizooyjnllostamffpp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=   # seed only, user pastes it
```
- [ ] **Step 4:** `vitest.config.ts` with `@` alias; `package.json` scripts `"test": "vitest run"`, `"seed": "tsx scripts/seed.ts"`, `"typecheck": "tsc --noEmit"`.
- [ ] **Step 5:** `npm run build` → PASS. Commit `chore: scaffold next.js app`.

### Task 2: Database schema (migration `cs_schema`)

**Files:** Create `supabase/migrations/20261007000001_cs_schema.sql`; apply via Supabase MCP `apply_migration`.

**Produces:** tables `cs_admins, cs_profiles, cs_categories, cs_products, cs_product_images, cs_variants, cs_orders, cs_order_items, cs_settings`; enums `cs_order_status, cs_payment_method, cs_payment_status`.

- [ ] **Step 1:** Write the SQL (enums, tables with CHECK constraints from the spec, indexes, `cs_set_updated_at` trigger for products/profiles/orders/settings). Full SQL lives in the migration file.
- [ ] **Step 2:** Apply; verify with `list_tables` that 9 `cs_` tables exist with RLS enabled.
- [ ] **Step 3:** Commit `feat(db): cs schema`.

### Task 3: RLS + admin check + storage (migration `cs_rls`)

**Files:** Create `supabase/migrations/20261007000002_cs_rls.sql`.

**Produces:** `public.cs_is_admin() returns boolean` (authenticated only); policies per spec §3; bucket `cs-products` (public, 5MB, jpeg/png/webp/avif) with admin-only write policies; `insert into cs_admins values ('<admin-email>')`.

- [ ] **Step 1:** Write SQL; every policy uses `(select auth.uid())` / `(select public.cs_is_admin())` for plan caching; revoke `insert, update, delete` on `cs_orders, cs_order_items` and all on `cs_admins` from `anon, authenticated`.
- [ ] **Step 2:** Apply; run `get_advisors(security)` → no new `cs_` findings.
- [ ] **Step 3:** Commit `feat(db): rls policies and storage`.

### Task 4: Order functions (migration `cs_order_functions`)

**Files:** Create `supabase/migrations/20261007000003_cs_order_functions.sql`.

**Produces:**
- `public.cs_place_order(p_items jsonb, p_shipping jsonb, p_payment_method cs_payment_method) returns text` — `p_items = [{variant_id, quantity}]`, `p_shipping = {recipient_name, phone, address_line, ward, district, province, note}`. Returns order `code`. Raises `UNAUTHENTICATED | INVALID_INPUT | RATE_LIMITED | NOT_FOUND | OUT_OF_STOCK` (detail = variant id).
- `public.cs_admin_update_order(p_order_id uuid, p_status cs_order_status, p_payment_status cs_payment_status) returns void` — raises `FORBIDDEN | NOT_FOUND | INVALID_TRANSITION`; cancelling restocks.

- [ ] **Step 1:** Write SQL (single transaction; lock variants `for update` in variant-id order; price from DB; shipping from `cs_settings.shipping {flat_fee, free_threshold}`; rate limit 5 orders/10 min/user).
- [ ] **Step 2:** Apply. Commit `feat(db): order functions`.

### Task 5: Database tests

**Files:** Create `supabase/tests/rls_and_orders.sql` — one `DO` block that creates fixture users/products, switches `role` + `request.jwt.claims` via `set_config`, asserts, and finally `raise exception 'CS_TESTS_PASSED'` so everything rolls back.

Assertions:
1. anon sees published product, not hidden one; anon sees no variants of hidden product.
2. user A cannot see user B's order; cannot `insert` into `cs_products` (insufficient_privilege / RLS violation).
3. user A cannot `insert` into `cs_orders` directly.
4. `cs_place_order` as A: returns code, decrements stock, computes total from DB price + flat fee.
5. ordering more than stock → `OUT_OF_STOCK`; stock unchanged.
6. admin sees all orders; `cs_admin_update_order(..,'cancelled',..)` restocks; non-admin call → `FORBIDDEN`.
7. anon cannot execute `cs_place_order`.

- [ ] **Step 1:** Write the test; run via `execute_sql`. Expected: error message exactly `CS_TESTS_PASSED`. Any `FAIL:` message = fix migration, re-apply, re-run.
- [ ] **Step 2:** Commit `test(db): rls and order function tests`.

### Task 6: Supabase clients, proxy, auth guards, DB types

**Files:**
- Create `src/lib/supabase/server.ts` → `createClient(): Promise<SupabaseClient<Database>>` (cookie session).
- Create `src/lib/supabase/public.ts` → `createPublicClient()` (no cookies, safe inside cached functions for public data).
- Create `src/lib/supabase/client.ts` → `createClient()` browser.
- Create `src/lib/supabase/proxy.ts` → `updateSession(request)`.
- Create `src/proxy.ts` → gates `/admin/:path*` (non-admin → `/login?next=`), `/checkout`, `/account` (anon → `/login?next=`).
- Create `src/services/auth.ts` → `getCurrentUser(): Promise<{id,email}|null>`, `isAdmin(): Promise<boolean>` (rpc `cs_is_admin`), `requireUser()`, `requireAdmin()` (redirect).
- Create `src/types/database.ts` via MCP `generate_typescript_types`.

- [ ] **Step 1:** Implement; `npm run typecheck && npm run build` → PASS.
- [ ] **Step 2:** Commit `feat(auth): supabase clients and route guards`.

### Task 7: Domain utils + validation (TDD)

**Files:** `src/lib/money.ts` (`formatVnd(n: number): string`), `src/lib/shipping.ts` (`calcShippingFee(subtotal, {flat_fee, free_threshold}): number` — must mirror SQL), `src/lib/validation/auth.ts` (`loginSchema`, `registerSchema`, `forgotSchema`), `src/lib/validation/settings.ts` (`themeSchema` hex colors / font enum, `shippingSchema`); tests in `src/lib/**/*.test.ts`.

- [ ] **Step 1:** Write failing tests (e.g. `formatVnd(1250000) === '1.250.000 ₫'`; `calcShippingFee(499999,{flat_fee:30000,free_threshold:500000}) === 30000`, `calcShippingFee(500000, …) === 0`; `themeSchema` rejects `"red;}body{x"`; `registerSchema` rejects password < 8 and mismatched confirm).
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** implement. **Step 4:** `npm test` → PASS. **Step 5:** commit `feat: money, shipping and validation utils`.

### Task 8: Design tokens, layout, theme injection

**Files:** `src/app/globals.css` (Tailwind v4 `@theme` mapped to CSS vars `--color-bg, --color-fg, --color-muted, --color-accent, --color-border`, dark default + `[data-theme=light]`), `src/app/layout.tsx` (Space Grotesk + Inter with `vietnamese` subset, `lang="vi"`), `src/services/settings.ts` (`getSettings()` cached with tag `settings`, parsed with Zod, defaults on failure), `src/components/theme-style.tsx` (renders validated vars), `src/components/ui/{button,input,field}.tsx`.

- [ ] **Step 1:** Implement; minimal placeholder home page showing brand name from settings.
- [ ] **Step 2:** build PASS; commit `feat(ui): design tokens and theme injection`.

### Task 9: Auth pages

**Files:** `src/app/(auth)/{login,register,forgot-password}/page.tsx`, `src/app/(auth)/actions.ts` (Server Actions: `login`, `register`, `forgotPassword`, `logout` — Zod-validated, generic error messages, `next` param restricted to same-origin relative paths), `src/app/auth/confirm/route.ts` (`verifyOtp` with `token_hash` for email confirm/recovery), `src/app/(auth)/reset-password/page.tsx`.

- [ ] **Step 1:** Implement; add test for `safeNextPath()` (rejects `//evil.com`, `https://…`, accepts `/account`).
- [ ] **Step 2:** `npm test && npm run build` PASS; commit `feat(auth): login, register, password reset`.

### Task 10: Seed

> **Changed during execution:** seed is `supabase/seed.sql` (idempotent, runs as postgres via MCP / SQL editor) instead of `scripts/seed.ts`. No `service_role` key is needed anywhere in the project. Images are free-license Unsplash photos verified to return HTTP 200.

**Files:** `scripts/seed.ts` — service-role client from `.env.local`; idempotent upserts by `slug`/`sku`/`key`: 6 categories, 24 products (Unsplash image URLs), variants S–XL × 2–3 colors with stock, settings `theme, store, seo, shipping {flat_fee:30000, free_threshold:500000}, bank, banners, policies`.

- [ ] **Step 1:** Implement; requires user to paste `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` (STOP and ask if missing).
- [ ] **Step 2:** `npm run seed` twice → second run makes no duplicates (verify counts via SQL).
- [ ] **Step 3:** Commit `feat: seed data`.

### Task 11: Foundation verification

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` → all PASS.
- [ ] Re-run DB test → `CS_TESTS_PASSED`; `get_advisors` security + performance for `cs_` objects.
- [ ] Playwright smoke: `/login` renders, `/admin` redirects anon to `/login?next=%2Fadmin`, register form shows Vietnamese validation errors, axe has no serious violations.
- [ ] Commit `chore: foundation verified`.

## Manual steps for the user (cannot be automated safely)
1. Paste `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` (Task 10).
2. In Supabase Dashboard → Auth → URL Configuration, add `http://localhost:3000/**` (and later the Vercel domain) to Redirect URLs.
3. Register `<admin-email>` on `/register` and confirm the email to activate admin.
