# Cart & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cart (localStorage, drawer), add-to-cart on PDP, one-page checkout (COD / VietQR bank transfer) calling `cs_place_order`, order detail page with VietQR, order history in account.

**Architecture:** Cart is client state (`useSyncExternalStore` over localStorage, cross-tab via `storage` event) with pure reducer functions in `src/lib/cart.ts`. The server never trusts cart prices: checkout re-quotes variants (`quoteVariants` action) for display, and `cs_place_order` recomputes everything in one DB transaction. Order reads go through `src/services/orders.ts` with the session client so RLS limits users to their own orders.

**Tech Stack:** Next.js 16 Server Actions, Supabase RPC, Zod 4, React 19 `useActionState`/`useSyncExternalStore`.

**Spec:** `docs/superpowers/specs/2026-10-07-clothes-shop-design.md` (§3 functions, §4 checkout, §7 edge cases)

## Global Constraints
- Login required for `/checkout`, `/orders/*`, `/account` (proxy + `requireUser()` in every page/action).
- Quantity per line 1–20, max 50 lines (mirrors `cs_place_order`).
- Error codes from DB mapped to Vietnamese messages; never show raw DB errors.
- After a successful order: `updateTag(CATALOG_TAG)` so stock on PDP/listing refreshes immediately.
- VietQR image: `https://img.vietqr.io/image/{bin}-{account}-compact2.png?amount={total}&addInfo={code}&accountName={name}`; hidden when bank settings are empty.

---

### Task 1: Cart logic + checkout validation (TDD)
**Files:** `src/lib/cart.ts`, `src/lib/validation/checkout.ts`, `src/lib/order-errors.ts`, tests.
**Produces:** `CartLine = { variantId, slug, name, image, size, color, price, qty, maxQty }`; `addLine(lines, line)`, `setQty(lines, variantId, qty)`, `removeLine(lines, variantId)`, `cartCount(lines)`, `cartSubtotal(lines)`, `reconcile(lines, quotes)`; `checkoutSchema`; `orderErrorMessage(code: string): string`.

### Task 2: Cart store + drawer + header button + add-to-cart
**Files:** `src/components/cart/{cart-store.ts,cart-provider.tsx,cart-drawer.tsx,cart-button.tsx,add-to-cart.tsx}`; wire into store layout, header, `ProductView`.

### Task 3: Orders service + place-order action
**Files:** `src/services/orders.ts` (`getMyProfile`, `getMyOrders`, `getOrderByCode`), `src/app/(store)/checkout/actions.ts` (`quoteVariants`, `placeOrder`).

### Task 4: Checkout page
**Files:** `src/app/(store)/checkout/{page.tsx,checkout-form.tsx}` — prefilled from profile, re-quote on mount, inline errors, empty-cart state, pending state, success → clear cart → `/orders/{code}`.

### Task 5: Order page + account history
**Files:** `src/app/(store)/orders/[code]/page.tsx`, update `src/app/(store)/account/page.tsx`.

### Task 6: Verification
- lint, typecheck, unit tests, build.
- DB: create a confirmed throwaway user via SQL inside a rolled-back transaction is not possible for browser E2E → E2E uses a real test account created by the user OR is limited to guest flows (cart drawer, redirect to login). Logged-in checkout is verified by the existing `cs_place_order` SQL tests plus a manual run.
- axe on cart drawer + checkout page (logged-out redirect + rendering).
