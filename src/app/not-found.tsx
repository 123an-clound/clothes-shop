import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-8">
      <p className="font-display text-[clamp(6rem,25vw,16rem)] leading-none font-bold text-accent">404</p>
      <h1 className="text-4xl uppercase sm:text-6xl">Không tìm thấy trang</h1>
      <p className="max-w-md text-muted">Trang bạn tìm có thể đã bị xoá hoặc đổi địa chỉ.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/shop" className={buttonClass("primary")}>
          Xem sản phẩm
        </Link>
        <Link href="/" className={buttonClass("outline")}>
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
