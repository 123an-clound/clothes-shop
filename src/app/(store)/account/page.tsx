import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogoutButton } from "@/components/logout-button";
import { buttonClass } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";
import { formatVnd } from "@/lib/money";
import { isAdmin, requireUser } from "@/services/auth";
import { getMyOrders, STATUS_LABEL } from "@/services/orders";

export const metadata: Metadata = { title: "Tài khoản", robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-16 sm:px-8">
      <h1 className="text-5xl uppercase sm:text-7xl">Tài khoản</h1>
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <AccountDetails />
      </Suspense>
    </div>
  );
}

async function AccountDetails() {
  const user = await requireUser("/account");
  const [admin, orders] = await Promise.all([isAdmin(), getMyOrders()]);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <p>
          Đăng nhập với <strong>{user.email}</strong>
        </p>
        <div className="flex flex-wrap gap-3">
          {admin && (
            <Link href="/admin" className={buttonClass("primary")}>
              Trang quản trị
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      <section aria-labelledby="orders-h">
        <h2 id="orders-h" className="mb-4 text-3xl uppercase">
          Đơn hàng của tôi
        </h2>
        {orders.length === 0 ? (
          <p className="text-muted">
            Bạn chưa có đơn hàng nào.{" "}
            <Link href="/shop" className="font-bold text-fg underline underline-offset-4">
              Mua sắm ngay
            </Link>
          </p>
        ) : (
          <ul className="border-t border-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.code}`}
                  className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-line py-4 hover:bg-surface sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <span>
                    <span className="block font-mono font-bold">{o.code}</span>
                    <span className="text-sm text-muted">{formatDateTime(o.created_at)}</span>
                  </span>
                  <span className="text-sm font-bold uppercase sm:text-right">{STATUS_LABEL[o.status]}</span>
                  <span className="font-bold sm:min-w-28 sm:text-right">{formatVnd(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
