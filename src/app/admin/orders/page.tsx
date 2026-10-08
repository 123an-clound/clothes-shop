import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/form";
import { formatDateTime } from "@/lib/format-date";
import { formatVnd } from "@/lib/money";
import { ADMIN_PAGE_SIZE, listAdminOrders } from "@/services/admin";
import { STATUS_LABEL, type OrderStatus } from "@/services/orders";

export const metadata: Metadata = { title: "Đơn hàng" };

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageHeader title="Đơn hàng" />
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <OrderList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

async function OrderList({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  const sp = await searchParams;
  const q = (first(sp.q) ?? "").trim().slice(0, 30);
  const statusRaw = first(sp.status);
  const status = STATUSES.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined;
  const page = Math.max(1, Math.min(1000, Number(first(sp.page)) || 1));
  const { items, total } = await listAdminOrders({ q, status, page });
  const pages = Math.ceil(total / ADMIN_PAGE_SIZE);
  const href = (p: { status?: string; page?: number }) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    const st = "status" in p ? p.status : status;
    if (st) s.set("status", st);
    if (p.page && p.page > 1) s.set("page", String(p.page));
    const qs = s.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <form action="/admin/orders" className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <label className="sr-only" htmlFor="oq">
            Tìm theo mã đơn hoặc số điện thoại
          </label>
          <input id="oq" name="q" defaultValue={q} placeholder="Mã đơn / SĐT…" className="min-h-11 w-56 border-2 border-line bg-surface px-3 text-fg focus:border-accent-ink focus:outline-none" />
          <button className="min-h-11 cursor-pointer border-2 border-fg px-4 text-sm font-bold uppercase">Tìm</button>
        </form>
        <nav aria-label="Lọc trạng thái" className="flex flex-wrap gap-1">
          {[undefined, ...STATUSES].map((s) => (
            <Link
              key={s ?? "all"}
              href={href({ status: s })}
              aria-current={status === s ? "page" : undefined}
              className="min-h-11 content-center border-2 border-line px-3 text-sm font-bold aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg"
            >
              {s ? STATUS_LABEL[s] : "Tất cả"}
            </Link>
          ))}
        </nav>
      </div>

      {items.length === 0 ? (
        <p className="border-2 border-dashed border-line p-8 text-center text-muted">Không có đơn hàng phù hợp.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-fg text-xs text-muted uppercase">
                <th className="py-2">Mã đơn</th>
                <th className="py-2">Khách</th>
                <th className="py-2">Ngày đặt</th>
                <th className="py-2">Trạng thái</th>
                <th className="py-2">Thanh toán</th>
                <th className="py-2 text-right">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-b border-line hover:bg-surface">
                  <td className="py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-bold underline underline-offset-4">
                      {o.code}
                    </Link>
                  </td>
                  <td className="py-3">
                    {o.recipient_name}
                    <span className="block text-xs text-muted">{o.phone}</span>
                  </td>
                  <td className="py-3 text-muted">{formatDateTime(o.created_at)}</td>
                  <td className="py-3 font-bold">{STATUS_LABEL[o.status]}</td>
                  <td className="py-3">
                    {o.payment_method === "cod" ? "COD" : "Chuyển khoản"}
                    <span className={`block text-xs ${o.payment_status === "paid" ? "" : "text-muted"}`}>{o.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</span>
                  </td>
                  <td className="py-3 text-right font-bold">{formatVnd(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Phân trang" className="flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: n })}
              aria-current={n === page ? "page" : undefined}
              className="grid size-11 place-items-center border-2 border-line font-bold aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg"
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
