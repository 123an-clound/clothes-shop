# YÊU CẦU XÂY DỰNG DỰ ÁN CLOTHES-SHOP (CAO CẤP)

**Vai trò của bạn (Claude Code):** Bạn là một Chuyên gia Lập trình Full-stack (Senior/Lead Developer) với chuyên môn sâu về UI/UX và bảo mật hệ thống. Nhiệm vụ của bạn là thiết kế, lập trình và hoàn thiện một website thương mại điện tử bán quần áo tại thị trường Việt Nam với **giao diện cực kỳ đẳng cấp, thu hút** và **backend bảo mật tuyệt đối, tối ưu hiệu năng cao, mã nguồn sạch sẽ theo tiêu chuẩn doanh nghiệp lớn**.

## 1. QUY TẮC LÀM VIỆC CỐT LÕI (BẮT BUỘC)
* **KHÔNG ĐOÁN MÒ:** Bất cứ khi nào thiếu thông tin về cấu hình, API keys, kiến trúc database, hoặc yêu cầu logic chưa rõ ràng, bạn PHẢI dừng lại và hỏi người dùng. Tuyệt đối không tự ý giả định hay sử dụng dữ liệu giả (trừ hình ảnh/thông tin sản phẩm ban đầu được phép lấy từ internet).
* **TỰ KIỂM TRA & SỬA LỖI (Self-Healing Loop):** Code xong module nào, bắt buộc tự chạy kiểm tra (lint, build, test logic, kiểm tra bảo mật). Nếu phát hiện lỗi, phải tự động phân tích nguyên nhân cốt lõi, khắc phục và chạy lại test đến khi xanh toàn bộ.
* **CLEAN CODE & DESIGN PATTERNS:** Viết code tuân thủ tiêu chuẩn SOLID, DRY, KISS. Sử dụng các design pattern phù hợp. Phân chia thư mục rõ ràng (components, hooks, utils, services, types).
* **TỐI ƯU CHI PHÍ:** Sử dụng giải pháp mã nguồn mở. Tối ưu số lượng API calls và Database queries để hoạt động mượt mà trong giới hạn của Supabase miễn phí.

## 2. GIAO DIỆN CHUYÊN NGHIỆP VÀ THU HÚT (PREMIUM UI/UX)
* **Công nghệ UI:** Khuyến nghị sử dụng Next.js (App Router) hoặc React/Vite, kết hợp Tailwind CSS và thư viện hiệu ứng như Framer Motion để tạo ra trải nghiệm đỉnh cao.
* **Thẩm mỹ (Rich Aesthetics):** 
  * Giao diện phải mang lại cảm giác "WOW" ngay từ cái nhìn đầu tiên. Sang trọng, cao cấp, không sử dụng thiết kế sơ sài.
  * **Màu sắc & Typography:** Sử dụng các bảng màu hài hòa, tinh tế (hỗ trợ Light/Dark mode). Sử dụng font chữ hiện đại (như Inter, Roboto, Outfit).
  * **Hiệu ứng & Animations:** BẮT BUỘC áp dụng micro-animations, mượt mà khi chuyển trang, hover effects sinh động, lazy loading ảnh với blur placeholder, hiệu ứng parallax nhẹ hoặc glassmorphism ở các thành phần phù hợp.
  * **Layout:** Bố cục linh hoạt, không gian (whitespace) rộng rãi, hình ảnh sản phẩm là trung tâm. Tối ưu hiển thị hoàn hảo trên Mobile (Mobile-first design), Tablet và Desktop.

## 3. BACKEND SẠCH, BẢO MẬT & TỐI ƯU (SECURE & OPTIMIZED BACKEND)
* **Kiến trúc:** Xây dựng logic rõ ràng (ví dụ: Server Components / Server Actions trong Next.js). Tạo các service layers riêng biệt để giao tiếp với database, không gọi thẳng database từ UI component.
* **Bảo mật (Security First):**
  * **Row Level Security (RLS):** BẮT BUỘC thiết lập RLS cực kỳ chặt chẽ trên Supabase. Chỉ user có quyền mới được đọc/ghi dữ liệu của họ. Admin có chính sách truy cập toàn quyền.
  * **Validation & Sanitization:** Toàn bộ dữ liệu đầu vào (từ form, API) phải được validate chặt chẽ ở backend (sử dụng thư viện như Zod) để chống XSS, SQL Injection.
  * **Authentication & Authorization:** Quản lý phiên làm việc an toàn, phân quyền rõ ràng giữa Khách hàng và Admin. Bảo vệ các route nhạy cảm bằng Middleware.
* **Hiệu năng (Performance):**
  * Tối ưu hóa truy vấn Database: Tạo index cho các trường hay tìm kiếm, tránh lỗi query N+1, chỉ lấy các trường dữ liệu cần thiết.
  * Tận dụng Caching để tải trang siêu tốc. Tự động nén và tối ưu kích thước hình ảnh (WebP).

## 4. CHỨC NĂNG TRANG QUẢN TRỊ (ADMIN DASHBOARD)
Trang Admin phải là một hệ thống CMS chuyên nghiệp, bảo mật và tinh gọn:
* **Bảo mật Admin:** Phân quyền nghiêm ngặt, thiết kế trang đăng nhập an toàn, dashboard có tổng quan thống kê.
* **Quản lý sản phẩm nâng cao:** Thêm, sửa, xóa, ẩn/hiện sản phẩm. Quản lý chi tiết biến thể (size, màu sắc, tồn kho từng loại). Hỗ trợ upload nhiều ảnh cùng lúc.
* **Quản lý giao diện (Theme Builder):** Cung cấp công cụ để Admin thay đổi màu sắc chủ đạo, font chữ, bố cục hiển thị, banner, logo. Lưu cấu hình vào Supabase và website tự động áp dụng (real-time) mà không cần deploy lại mã nguồn.
* **Quản lý cấu hình & SEO:** Cập nhật thông tin liên hệ, liên kết MXH, chính sách, meta SEO (Title, Description) trực tiếp từ giao diện Admin.

## 5. CHỨC NĂNG TRANG KHÁCH HÀNG (STOREFRONT)
* **Trang chủ:** Hero banner động, bắt mắt. Hiển thị danh mục nổi bật, sản phẩm bán chạy/mới về với hiệu ứng scroll mượt mà.
* **Bộ lọc thông minh (Faceted Search):** Lọc sản phẩm tức thì theo giá, danh mục, kích cỡ, màu sắc không cần reload trang (dữ liệu cập nhật mượt mà).
* **Chi tiết sản phẩm (PDP):** Tối ưu hóa để chuyển đổi. Thư viện ảnh độ phân giải cao, thay đổi theo biến thể đang chọn. Cập nhật giá và tồn kho realtime.
* **Giỏ hàng & Thanh toán:** UI/UX mượt mà, thao tác ít bước nhất có thể. Hiển thị rõ ràng giỏ hàng và validate form thanh toán chính xác.
* **SEO Best Practices:** Tự động tối ưu SEO (thẻ meta, sitemap.xml, thẻ H1/H2 chuẩn phân cấp, OpenGraph), đảm bảo các trang sản phẩm lên top tìm kiếm.

## 6. DỮ LIỆU KHỞI TẠO (SEED DATA)
* Tạo script seed dữ liệu mẫu chất lượng cao (ảnh đẹp lấy từ internet, mô tả chuyên nghiệp) để test giao diện và luồng hoạt động ngay lập tức. Sau đó admin sẽ tự quản lý và thay thế bằng dữ liệu thật.

## 7. QUY TRÌNH TRIỂN KHAI VÀ QUẢN LÝ MÃ NGUỒN (GIT)
1. **Khởi tạo:** Thiết lập project với các chuẩn mực cao nhất, cài đặt dependencies, cấu hình Supabase và các quy tắc RLS.
2. **Thực thi tuần tự:** Xây dựng từ Database Schema/RLS -> Core Services/Backend API -> UI Components System -> Admin Dashboard -> Storefront.
3. **Kiểm thử chặt chẽ:** Tự kiểm tra các luồng đi, audit bảo mật, xử lý toàn bộ edge cases (ví dụ: lỗi mạng, nhập sai dữ liệu, giỏ hàng trống).
4. **Bàn giao:** Sau khi code chạy hoàn hảo, mượt mà và không còn lỗi, thực hiện commit toàn bộ dự án và push lần đầu lên kho lưu trữ: `https://github.com/123an-clound/clothes-shop`.