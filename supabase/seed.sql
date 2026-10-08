-- clothes-shop sample data. Idempotent: safe to run again (upserts by slug / sku / key).
-- Images: free-license Unsplash photos (images.unsplash.com). Admin replaces with real data later.
-- Runs as postgres (SQL editor or Supabase MCP execute_sql), bypassing RLS.
-- Parts can be executed separately; part 2+ each need the pg_temp.seed_product definition first.

-- ── Part 1: settings + categories ─────────────────────────────────────────────
insert into public.cs_settings (key, value) values
  ('theme', '{"accent":"#c6ff00","background":"#0a0a0a","foreground":"#f5f5f0","font_display":"space-grotesk","font_body":"inter","radius":"none","logo_url":""}'),
  ('store', '{"name":"CLOTHES SHOP","tagline":"Streetwear cho thế hệ không ngừng chuyển động.","email":"","phone":"","address":"","facebook":"","instagram":"","tiktok":""}'),
  ('seo', '{"title":"CLOTHES SHOP — Streetwear Việt Nam","description":"Áo thun, hoodie, áo khoác, quần cargo và phụ kiện streetwear. Đổi trả 7 ngày, giao hàng toàn quốc.","og_image":""}'),
  ('shipping', '{"flat_fee":30000,"free_threshold":500000}'),
  ('bank', '{"bank_bin":"","account_number":"","account_name":""}'),
  ('banners', '[{"image_url":"https://images.unsplash.com/photo-1769689388217-c3c8fec7099d?w=1920&q=80&auto=format","title":"DROP 01 — CITY NIGHTS","subtitle":"Puffer, cargo và những gam màu tối cho đêm thành phố.","cta_label":"Mua ngay","cta_href":"/shop"},{"image_url":"https://images.unsplash.com/photo-1532332248682-206cc786359f?w=1920&q=80&auto=format","title":"OVERSIZED EVERYTHING","subtitle":"Form rộng, chất dày, mặc là chất.","cta_label":"Xem áo thun","cta_href":"/shop/ao-thun"}]'),
  ('policies', '{"shipping":"Giao hàng toàn quốc 2–5 ngày. Miễn phí vận chuyển cho đơn từ 500.000đ.","returns":"Đổi size hoặc trả hàng trong 7 ngày nếu sản phẩm còn nguyên tem mác.","privacy":"Chúng tôi chỉ dùng thông tin của bạn để xử lý đơn hàng và không chia sẻ cho bên thứ ba."}')
on conflict (key) do nothing;

insert into public.cs_categories (slug, name, description, image_url, sort_order, is_featured) values
  ('ao-thun', 'Áo thun', 'Tee oversized cotton dày dặn, in lụa sắc nét.', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80&auto=format', 1, true),
  ('hoodie', 'Hoodie & Sweater', 'Nỉ bông 380gsm, form boxy, giữ ấm mà vẫn chất.', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=80&auto=format', 2, true),
  ('ao-khoac', 'Áo khoác', 'Varsity, puffer, windbreaker cho mọi thời tiết.', 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&q=80&auto=format', 3, true),
  ('quan', 'Quần', 'Cargo nhiều túi, jogger và quần ống suông.', 'https://images.unsplash.com/photo-1584302052177-2e90841dad6a?w=1200&q=80&auto=format', 4, true),
  ('mu', 'Mũ', 'Cap, snapback và bucket hat thêu logo.', 'https://images.unsplash.com/photo-1568246621541-5704b4f0bbf2?w=1200&q=80&auto=format', 5, false),
  ('phu-kien', 'Túi & Phụ kiện', 'Tote canvas, balo và phụ kiện hoàn thiện outfit.', 'https://images.unsplash.com/photo-1572196284554-4e321b0e7e0b?w=1200&q=80&auto=format', 6, false)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, image_url = excluded.image_url,
  sort_order = excluded.sort_order, is_featured = excluded.is_featured;

-- ── Helper (session-scoped, never persisted) ──────────────────────────────────
create or replace function pg_temp.seed_product(
  p_slug text, p_name text, p_cat text, p_price integer, p_compare integer, p_featured boolean,
  p_desc text, p_img1 text, p_img2 text, p_colors text, p_sizes text
) returns void language plpgsql as $f$
declare
  v_id uuid;
begin
  insert into public.cs_products (slug, name, description, category_id, price, compare_at_price, is_published, is_featured)
  values (p_slug, p_name, p_desc, (select id from public.cs_categories where slug = p_cat), p_price, p_compare, true, p_featured)
  on conflict (slug) do update set
    name = excluded.name, description = excluded.description, category_id = excluded.category_id,
    price = excluded.price, compare_at_price = excluded.compare_at_price, is_featured = excluded.is_featured
  returning id into v_id;

  delete from public.cs_product_images where product_id = v_id;
  insert into public.cs_product_images (product_id, url, alt, sort_order) values
    (v_id, 'https://images.unsplash.com/' || p_img1 || '?w=1200&q=80&auto=format', p_name || ' — ảnh 1', 0),
    (v_id, 'https://images.unsplash.com/' || p_img2 || '?w=1200&q=80&auto=format', p_name || ' — ảnh 2', 1);

  -- Every size x color. Deterministic stock; XL of the 2nd color is sold out to exercise out-of-stock UI.
  insert into public.cs_variants (product_id, size, color, color_hex, sku, stock)
  select v_id, sz.size, split_part(col.c, ':', 1), split_part(col.c, ':', 2),
         upper(p_slug) || '-' || sz.size || '-' || col.ord,
         case when sz.size = 'XL' and col.ord = 2 then 0 else 5 + (sz.ord * 3 + col.ord * 2) % 20 end
  from unnest(string_to_array(p_colors, '|')) with ordinality as col (c, ord)
  cross join unnest(string_to_array(p_sizes, ',')) with ordinality as sz (size, ord)
  on conflict (sku) do nothing;
end
$f$;

-- ── Part 2: tees + hoodies ────────────────────────────────────────────────────
select pg_temp.seed_product('tee-oversized-basic-black', 'Tee Oversized Basic', 'ao-thun', 290000, null, true,
  'Áo thun form oversized, cotton 250gsm dày dặn, cổ bo rib chống giãn. Mặc một mình hay layer đều đẹp.',
  'photo-1503341504253-dff4815485f1', 'photo-1523585298601-d46ae038d7d3', 'Đen:#111111|Trắng:#f2f2f2', 'S,M,L,XL');
select pg_temp.seed_product('tee-graphic-flame', 'Tee Graphic Flame', 'ao-thun', 350000, 420000, true,
  'Hình in lửa phong cách Y2K, in lụa nhiều lớp bền màu. Cotton compact mềm mịn, không xù.',
  'photo-1593726891090-b4c6bc09c819', 'photo-1593726856932-b5b9a661ed46', 'Đen:#111111|Xanh than:#1f2a44', 'S,M,L,XL');
select pg_temp.seed_product('tee-boxy-washed', 'Tee Boxy Washed', 'ao-thun', 320000, null, false,
  'Wash acid tạo hiệu ứng bạc màu vintage, form boxy vai rơi. Mỗi chiếc mang sắc độ riêng.',
  'photo-1630590613173-b01fdb40a1eb', 'photo-1758267928367-35886ad47bc4', 'Xám wash:#5a5a5a|Đen wash:#2b2b2b', 'S,M,L,XL');
select pg_temp.seed_product('tee-heavy-white', 'Tee Heavyweight Trắng', 'ao-thun', 310000, null, false,
  'Cotton 280gsm đứng form, cổ tròn dày. Chiếc áo trắng nền tảng cho mọi outfit.',
  'photo-1593278641722-49b1047ede21', 'photo-1589902860314-e910697dea18', 'Trắng:#f2f2f2|Kem:#e8dfcc', 'S,M,L,XL');
select pg_temp.seed_product('hoodie-essential-grey', 'Hoodie Essential', 'hoodie', 590000, null, true,
  'Nỉ bông 380gsm, mũ hai lớp, túi kangaroo. Form boxy vai rơi chuẩn streetwear.',
  'photo-1556821840-3a63f95609a7', 'photo-1564557287817-3785e38ec1f5', 'Xám:#8a8a8a|Đen:#111111', 'S,M,L,XL');
select pg_temp.seed_product('hoodie-cloud-white', 'Hoodie Cloud', 'hoodie', 620000, 690000, true,
  'Tone trắng kem sạch sẽ, nỉ chân cua mềm. Bo tay và gấu dày giữ form lâu.',
  'photo-1620799140188-3b2a02fd9a77', 'photo-1615397587950-3cbb55f95b77', 'Trắng kem:#efe9dc|Be:#cdbfa6', 'S,M,L,XL');
select pg_temp.seed_product('hoodie-earth-brown', 'Hoodie Earth', 'hoodie', 590000, null, false,
  'Gam nâu đất dễ phối với cargo và jean. Nỉ bông dày, không xù sau giặt.',
  'photo-1578768079052-aa76e52ff62e', 'photo-1614214191247-5b2d3a734f1b', 'Nâu:#6b4a32|Đen:#111111', 'S,M,L,XL');
select pg_temp.seed_product('hoodie-block-yellow', 'Hoodie Color Block', 'hoodie', 650000, null, false,
  'Phối khối vàng – đen nổi bật, đường may đắp chắc chắn. Cho ngày muốn được chú ý.',
  'photo-1609873814058-a8928924184a', 'photo-1601063476271-a159c71ab0b3', 'Vàng đen:#e2b500|Trắng đen:#f2f2f2', 'S,M,L,XL');

-- ── Part 3: jackets + pants ───────────────────────────────────────────────────
select pg_temp.seed_product('jacket-puffer-gloss', 'Puffer Gloss', 'ao-khoac', 1290000, 1490000, true,
  'Puffer vỏ bóng chống nước nhẹ, ruột bông siêu nhẹ giữ ấm. Cổ đứng, khóa YKK.',
  'photo-1769689388217-c3c8fec7099d', 'photo-1768489039458-b499a027fbf3', 'Đen bóng:#0d0d0d|Bạc:#b8b8b8', 'S,M,L,XL');
select pg_temp.seed_product('jacket-varsity-brown', 'Varsity Heritage', 'ao-khoac', 990000, null, true,
  'Áo bóng chày dáng cổ điển, thân nỉ dạ, tay giả da. Bo sọc cổ và gấu.',
  'photo-1771310961705-c8b34eddbe9e', 'photo-1771310972919-b91ef93d08ef', 'Nâu:#6b4a32|Xanh navy:#1f2a44', 'S,M,L,XL');
select pg_temp.seed_product('jacket-windbreaker-black', 'Windbreaker Urban', 'ao-khoac', 790000, null, false,
  'Gió nhẹ, chống tạt nước, gấp gọn bỏ túi. Mũ trùm có dây rút.',
  'photo-1586231912972-d0970f9ce787', 'photo-1790688637653-5fa314591cbc', 'Đen:#111111|Rêu:#4b5320', 'S,M,L,XL');
select pg_temp.seed_product('jacket-camo-field', 'Field Jacket Camo', 'ao-khoac', 890000, 990000, false,
  'Họa tiết camo, 4 túi hộp, vải kaki wash mềm. Phong cách military đường phố.',
  'photo-1772521240135-e47228e155f7', 'photo-1608976198709-5e70a09b9ff0', 'Camo:#5b5a3c|Nâu:#6b4a32', 'S,M,L,XL');
select pg_temp.seed_product('pants-cargo-black', 'Cargo Utility', 'quan', 550000, null, true,
  'Quần cargo 6 túi, ống suông, gấu có dây rút. Kaki dày đứng form.',
  'photo-1584302052177-2e90841dad6a', 'photo-1584302052153-623ee529b70c', 'Đen:#111111|Rêu:#4b5320', 'S,M,L,XL');
select pg_temp.seed_product('pants-cargo-olive', 'Cargo Olive', 'quan', 560000, 620000, false,
  'Gam rêu quân đội phối được mọi áo. Túi hộp nắp bấm, lưng chun có dây.',
  'photo-1652845008007-2a785735199c', 'photo-1649850874075-49e014357b9d', 'Rêu:#4b5320|Be:#cdbfa6', 'S,M,L,XL');
select pg_temp.seed_product('pants-jogger-lavender', 'Jogger Pastel', 'quan', 450000, null, false,
  'Jogger nỉ da cá màu pastel, bo gấu, túi khóa kéo. Thoải mái cả ngày.',
  'photo-1789110520465-efc5ff05c95e', 'photo-1789110520495-8f1b8545c0ff', 'Tím lavender:#b9a7d8|Hồng:#e8a8b8', 'S,M,L,XL');
select pg_temp.seed_product('pants-wide-grey', 'Wide Leg Trouser', 'quan', 520000, null, false,
  'Quần ống rộng dáng suông, vải tuyết mưa ít nhăn. Lịch sự mà vẫn street.',
  'photo-1527813972756-2890936000e9', 'photo-1548883354-7622d03aca27', 'Xám:#8a8a8a|Đen:#111111', 'S,M,L,XL');

-- ── Part 4: caps + bags ───────────────────────────────────────────────────────
select pg_temp.seed_product('cap-fitted-black', 'Fitted Cap Classic', 'mu', 250000, null, true,
  'Mũ lưỡi trai vành cong, thêu logo nổi 3D. Khóa kim loại điều chỉnh vòng đầu.',
  'photo-1568246621541-5704b4f0bbf2', 'photo-1534215754734-18e55d13e346', 'Đen:#111111|Xám:#8a8a8a', 'Free');
select pg_temp.seed_product('cap-baseball-navy', 'Baseball Cap NY', 'mu', 270000, 320000, false,
  'Cap 6 panel cotton twill, form ôm đầu. Phối hợp mọi outfit đường phố.',
  'photo-1526127409788-75f6323664f5', 'photo-1635650804263-1a1941e14df5', 'Xanh navy:#1f2a44|Đen:#111111', 'Free');
select pg_temp.seed_product('cap-blue-dad', 'Dad Cap Washed', 'mu', 220000, null, false,
  'Mũ dad hat wash nhẹ, vành mềm, khóa đồng. Phong cách thoải mái.',
  'photo-1517941823-815bea90d291', 'photo-1720534490358-bc2ad29d51d5', 'Xanh:#3b6ea5|Be:#cdbfa6', 'Free');
select pg_temp.seed_product('cap-snapback-night', 'Cap Snapback Night', 'mu', 260000, null, false,
  'Snapback vành phẳng, mặt trước cứng. Hoàn hảo đi cùng puffer và cargo.',
  'photo-1768489039458-b499a027fbf3', 'photo-1773932547661-c1b800e6a9ef', 'Đen:#111111|Trắng:#f2f2f2', 'Free');
select pg_temp.seed_product('bag-tote-canvas', 'Tote Canvas Heavy', 'phu-kien', 290000, null, true,
  'Túi tote canvas 16oz, quai dài đeo vai, túi trong có khóa. Đựng vừa laptop 14 inch.',
  'photo-1572196284554-4e321b0e7e0b', 'photo-1721111260412-5541dc8fbec5', 'Đen:#111111|Kem:#e8dfcc', 'Free');
select pg_temp.seed_product('bag-tote-slogan', 'Tote Slogan', 'phu-kien', 260000, null, false,
  'Tote in slogan cá tính, canvas dày. Món phụ kiện nói thay bạn.',
  'photo-1575426553509-3c6953fdf9b6', 'photo-1623222403596-d0255da44c0b', 'Đen:#111111|Trắng:#f2f2f2', 'Free');
select pg_temp.seed_product('bag-backpack-sport', 'Backpack Sport', 'phu-kien', 690000, 790000, false,
  'Balo 22L chống nước, ngăn laptop riêng, quai đệm thoáng khí.',
  'photo-1602610202992-88d82e959b59', 'photo-1682317056294-1970c953cfd7', 'Đen trắng:#111111|Xám:#8a8a8a', 'Free');
select pg_temp.seed_product('bag-city-shopper', 'City Shopper Bag', 'phu-kien', 320000, null, false,
  'Túi shopper khổ lớn cho những ngày dạo phố, đáy gia cố chắc chắn.',
  'photo-1721111260492-afe3d9e5bd76', 'photo-1711880993227-4a1e690f21cf', 'Đen:#111111|Đỏ:#b3261e', 'Free');

-- ── Part 5: spread dates / sales so "Mới về" and "Bán chạy" rails show a mix ──
-- Stable pseudo-random order (md5 of slug). Only touches the seeded slug prefixes.
update public.cs_products p
set created_at = now() - (r.n * interval '9 hours'),
    sold_count = ('x' || substr(md5(p.slug || 'sold'), 1, 4))::bit(16)::integer % 150
from (
  select id, row_number() over (order by md5(slug)) as n
  from public.cs_products
  where slug ~ '^(tee|hoodie|jacket|pants|cap|bag)-'
) r
where p.id = r.id;
