# CLOTHES SHOP

Website bán quần áo streetwear: Next.js 16 (App Router, Cache Components) + Supabase (Postgres, Auth, Storage) + Tailwind CSS 4.

- Storefront: trang chủ, `/shop` lọc theo size/màu/giá (URL), trang sản phẩm, giỏ hàng, checkout COD / VietQR, tài khoản & lịch sử đơn.
- Admin (`/admin`): tổng quan, sản phẩm + biến thể + ảnh, danh mục, đơn hàng, Theme Builder, cài đặt (shop, SEO, ship, ngân hàng, FAQ, chính sách).
- Bảo mật: RLS trên mọi bảng `cs_*`, đơn hàng chỉ ghi qua hàm Postgres `security definer`, Zod ở mọi Server Action, CSP/HSTS, giới hạn số lần thử đăng nhập/đăng ký.

Thiết kế chi tiết: `docs/superpowers/specs/2026-10-07-clothes-shop-design.md`.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền giá trị (xem bên dưới)
npm run dev
```

| Biến | Ghi chú |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | URL gốc của site (canonical, sitemap, email redirect) |
| `RATE_LIMIT_SECRET` | Chuỗi ngẫu nhiên, chỉ ở server (`openssl rand -hex 32`) |

Không cần `service_role` key.

## Database

1. Chạy lần lượt `supabase/migrations/*.sql` (SQL editor hoặc Supabase CLI).
2. Chạy `supabase/seed.sql` để có dữ liệu mẫu (chạy lại nhiều lần không bị trùng).
3. Thêm admin: đăng ký tài khoản trên `/register`, xác nhận email, rồi chạy
   `insert into public.cs_admins (email) values ('<email-của-bạn>');`
4. Kiểm thử DB: chạy `supabase/tests/*.sql` — kết quả mong đợi là lỗi `CS_TESTS_PASSED` / `CS_ADMIN_TESTS_PASSED` (mọi thay đổi tự rollback).

Trong Supabase Dashboard → Auth: thêm `NEXT_PUBLIC_SITE_URL/**` vào Redirect URLs và bật Leaked password protection.

## Kiểm tra

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Deploy (Vercel)

Khai báo 4 biến môi trường ở trên (đặt `NEXT_PUBLIC_SITE_URL` là domain thật, https), bật Web Analytics trong project Vercel.
