# Clothes-Shop — Design Spec

Ngày: 2026-10-07 · Nguồn yêu cầu: `plan.md`

## 1. Quyết định đã chốt

| Mục | Quyết định |
|---|---|
| Stack | Next.js (App Router, TypeScript) + Tailwind CSS v4 + Motion + Lenis + Zod + `@supabase/ssr` |
| Supabase | Project có sẵn `Web-project` (`jtizooyjnllostamffpp`, ap-northeast-2), dùng chung với site khác → mọi bảng/hàm/bucket prefix `cs_` / `cs-` |
| Deploy | Vercel; repo `https://github.com/123an-clound/clothes-shop` |
| Thanh toán | COD + chuyển khoản VietQR tĩnh (admin xác nhận thủ công) |
| Tài khoản | Bắt buộc đăng nhập để đặt hàng; Email + mật khẩu (Supabase Auth) |
| Phí ship | Đồng giá + freeship từ ngưỡng (admin chỉnh trong settings) |
| Brand | Streetwear trẻ; tên placeholder `CLOTHES SHOP` (đổi qua Theme Builder) |
| Admin đầu tiên | `<admin-email>` (user tự đăng ký; chỉ email được thêm vào allowlist) |
| Ngoài phạm vi (YAGNI) | Coupon, review, wishlist, cổng thanh toán online, API hãng vận chuyển, đa ngôn ngữ |

## 2. Kiến trúc

```
src/
  app/
    (store)/            # storefront: /, /shop, /shop/[category], /products/[slug], /cart→drawer, /checkout, /orders/[code], /account
    (auth)/             # /login, /register, /forgot-password, /auth/callback
    admin/              # dashboard, products, categories, orders, theme, settings
    sitemap.ts robots.ts
  components/{ui,store,admin}
  services/             # mọi truy vấn Supabase (server-only)
  lib/supabase/{server,client,middleware}.ts
  lib/validation/       # Zod schemas dùng chung client + server
  lib/{money,shipping}.ts
  proxy.ts              # Next.js 16: thay middleware.ts
supabase/migrations/    # SQL schema + RLS + functions
scripts/seed.ts
```

- **Đọc:** Server Component → `services/*` → Supabase client mang session user (RLS luôn áp dụng).
- **Ghi:** Server Action → Zod parse → service. Không component nào gọi Supabase trực tiếp ngoài auth UI.
- **`service_role`:** chỉ dùng trong `scripts/seed.ts`, không bao giờ trong app runtime.
- **Auth:** `proxy.ts` refresh session (`@supabase/ssr`, xác thực bằng `getClaims()`, không tin `getSession()` ở server); `/admin/*` yêu cầu `cs_is_admin()`; `/checkout`, `/account` yêu cầu đăng nhập. RLS kiểm tra lại độc lập (defense-in-depth).
- **Caching:** Dữ liệu public (catalog, settings) dùng cache theo tag (`products`, `categories`, `settings`); admin mutation gọi `revalidateTag`. Dữ liệu theo user không cache.
- **Theme Builder:** `cs_settings.theme` (jsonb) → CSS variables inject ở root layout → admin lưu = `revalidateTag('settings')` → site đổi ngay, không redeploy.
- **Ảnh:** Supabase Storage bucket `cs-products`; `next/image` (WebP/AVIF, `placeholder="blur"`), `remotePatterns` giới hạn domain Supabase + Unsplash.

## 3. Data model (schema `public`, tất cả bật RLS)

- `cs_admins(email text pk, created_at)`
- `cs_profiles(id uuid pk → auth.users, full_name, phone, address_line, ward, district, province, updated_at)` — upsert khi user lưu thông tin lần đầu (không dùng trigger trên `auth.users` vì auth dùng chung với site khác).
- `cs_categories(id, slug unique, name, description, image_url, sort_order, is_featured, created_at)`
- `cs_products(id, slug unique, name, description, category_id → cs_categories, price int, compare_at_price int null, is_published, is_featured, sold_count int default 0, created_at, updated_at)`
- `cs_product_images(id, product_id → cascade, url, alt, color null, sort_order)`
- `cs_variants(id, product_id → cascade, size, color, color_hex, sku unique, price int null, stock int check (stock >= 0), unique(product_id,size,color))`
- `cs_orders(id, code unique, user_id → auth.users, status enum(pending,confirmed,shipping,completed,cancelled), payment_method enum(cod,bank_transfer), payment_status enum(unpaid,paid), recipient_name, phone, address_line, ward, district, province, note, subtotal, shipping_fee, total, created_at, updated_at)`
- `cs_order_items(id, order_id → cascade, variant_id → set null, product_name, size, color, unit_price, quantity check > 0)`
- `cs_settings(key text pk, value jsonb, updated_at)` — keys: `theme`, `store`, `seo`, `shipping`, `bank`, `banners`, `policies`.

Tiền lưu `integer` VND. Index: `cs_products(category_id, is_published)`, `cs_products(created_at desc)`, `cs_variants(product_id)`, `cs_product_images(product_id, sort_order)`, `cs_orders(user_id, created_at desc)`, `cs_order_items(order_id)`.

### Functions
- `cs_is_admin()` — `security definer`, `stable`: email của `auth.uid()` (đã confirm) ∈ `cs_admins`.
- `cs_place_order(items jsonb, shipping jsonb, payment_method)` — `security definer`, 1 transaction: yêu cầu `auth.uid()`; khóa các variant (`for update`); kiểm tra published + stock; tự tính giá từ DB (bỏ qua giá client); tính phí ship từ `cs_settings.shipping`; trừ stock; tăng `sold_count`; insert order + items; trả về `code`. Lỗi trả mã rõ ràng (`OUT_OF_STOCK`, `NOT_FOUND`, `INVALID_INPUT`).
- `cs_admin_update_order(order_id, status, payment_status)` — `security definer`, yêu cầu `cs_is_admin()`; khi chuyển sang `cancelled` thì hoàn stock + giảm `sold_count` trong cùng transaction. Admin không UPDATE `cs_orders` trực tiếp.

### RLS
| Bảng | anon/authenticated | admin |
|---|---|---|
| categories | SELECT | ALL |
| products / images / variants | SELECT khi product `is_published` | ALL |
| settings | SELECT | ALL |
| profiles | SELECT/UPDATE dòng của mình | SELECT |
| orders / order_items | SELECT của mình; không INSERT/UPDATE/DELETE trực tiếp | SELECT (ghi qua `cs_admin_update_order`) |
| admins | — | SELECT |
| storage `cs-products` | SELECT | INSERT/UPDATE/DELETE |

## 4. UI/UX

- **Visual:** dark-first (đen/off-white), accent neon (mặc định lime, admin đổi), font Space Grotesk (display) + Inter (body), đều có subset vietnamese qua `next/font`. Light/dark toggle.
- **Motion:** Motion cho micro-interaction + page transition; Lenis smooth scroll; tôn trọng `prefers-reduced-motion`.
- **Storefront:** Hero full-bleed + marquee; danh mục nổi bật; mới về / bán chạy; card hover đổi ảnh thứ 2; nav glassmorphism; cart drawer; faceted filter (giá, danh mục, size, màu) qua URL search params với `router.replace` + `useTransition` (không reload); PDP gallery đổi theo màu, giá + tồn kho theo biến thể đang chọn; checkout 1 trang; trang đơn hàng hiển thị VietQR (ảnh từ `img.vietqr.io` theo `cs_settings.bank`) khi chọn chuyển khoản.
- **Admin:** dashboard (doanh thu, số đơn theo trạng thái, sắp hết hàng); CRUD sản phẩm + ma trận biến thể size × màu + upload nhiều ảnh + sắp xếp; danh mục; đơn hàng (đổi trạng thái, đánh dấu đã thanh toán); Theme Builder (màu, font, logo, banner, layout) có live preview; settings (liên hệ, MXH, chính sách, SEO, ship, ngân hàng).
- **Mobile-first**, a11y WCAG 2.1 AA (contrast, focus ring, label, keyboard, alt).

## 5. SEO
`generateMetadata` từ `cs_settings.seo` + dữ liệu sản phẩm; OpenGraph; JSON-LD `Product`, `BreadcrumbList`, `Organization`; `sitemap.ts` (categories + products published); `robots.ts`; `noindex` cho `/admin`, `/account`, `/checkout`, `/orders`, auth pages. Mỗi trang 1 H1.

## 6. Bảo mật
- Zod validate mọi Server Action input; output escape mặc định bởi React (không `dangerouslySetInnerHTML` ngoài JSON-LD đã serialize an toàn).
- Rate limit đăng nhập dựa Supabase Auth; đặt hàng giới hạn qua check trong `cs_place_order` (tối đa 5 đơn / 10 phút / user).
- Upload: chỉ `image/jpeg|png|webp|avif`, ≤ 5MB, tên file random (uuid).
- Security headers (CSP, X-Frame-Options, Referrer-Policy) trong `next.config`.
- Secrets chỉ trong `.env.local` (gitignored) và Vercel env.

## 7. Lỗi & edge cases
`error.tsx` / `not-found.tsx` / `loading.tsx` skeleton; giỏ trống; mất mạng (toast + retry); hết hàng / giá đổi khi checkout → báo lỗi cụ thể + cập nhật giỏ; sản phẩm bị ẩn trong giỏ → loại bỏ có thông báo.

## 8. Kiểm thử
- Vitest: `money`, `shipping`, Zod schemas, cart reducer.
- SQL test RLS (chạy qua Supabase): anon không đọc product ẩn; user A không đọc order user B; user thường không ghi product/settings; `cs_place_order` từ chối oversell.
- Playwright E2E: browse → filter → PDP → cart → checkout; admin login → tạo sản phẩm → đổi theme.
- axe a11y + Lighthouse.

## 9. Seed
`supabase/seed.sql` (idempotent, chạy bằng quyền postgres qua Supabase MCP/SQL editor — không cần `service_role` key): ~6 danh mục, ~24 sản phẩm streetwear, ảnh Unsplash, biến thể size S–XL × 2–3 màu, settings mặc định, insert `<admin-email>` vào `cs_admins`.

## 10. Thứ tự triển khai (mỗi phần có plan riêng)
1. **Foundation:** scaffold Next.js, migrations (schema + RLS + functions + storage), auth + middleware, design tokens/UI primitives, seed.
2. **Storefront:** home, shop + filters, PDP, SEO.
3. **Cart & Checkout:** cart drawer, checkout, `cs_place_order`, trang đơn + VietQR, account.
4. **Admin CMS:** dashboard, products/variants/images, categories, orders, Theme Builder, settings.
5. **Gate & bàn giao:** security/a11y/perf gate, E2E, pre-launch, commit + push.
