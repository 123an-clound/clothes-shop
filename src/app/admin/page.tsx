import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { PageHeader } from "@/components/ui/form";
import { formatDateTime } from "@/lib/format-date";
import { formatVnd } from "@/lib/money";
import { getAdminStats } from "@/services/admin";
import { STATUS_LABEL, type OrderStatus } from "@/services/orders";

export const metadata: Metadata = { title: { absolute: "Tổng quan | Quản trị" } };

export default function AdminDashboard() {
  return (
    <>
      <PageHeader title="Tổng quan" />
      <Suspense fallback={<p className="text-muted">Đang tải số liệu…</p>}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const s = await getAdminStats();
  const tiles = [
    { label: "Doanh thu 30 ngày", value: formatVnd(s.revenue_30d) },
    { label: "Đơn 30 ngày", value: String(s.orders_30d) },
    { label: "Chờ xác nhận", value: String(s.by_status.pending ?? 0), href: "/admin/orders?status=pending" },
    { label: "Chuyển khoản chưa nhận", value: String(s.unpaid_transfers), href: "/admin/orders" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <>
              <span className="text-xs font-bold tracking-widest text-muted uppercase">{t.label}</span>
              <span className="font-display text-3xl font-bold sm:text-4xl">{t.value}</span>
            </>
          );
          return (
            <li key={t.label}>
              {t.href ? (
                <Link href={t.href} className="flex h-full flex-col gap-2 border-2 border-line p-4 hover:border-fg">
                  {body}
                </Link>
              ) : (
                <div className="flex h-full flex-col gap-2 border-2 border-line p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-10 xl:grid-cols-[2fr_1fr]">
        <section className="border-2 border-line p-4">
          <RevenueChart data={s.daily} />
          <p className="mt-3 text-xs text-muted">Tổng doanh thu (không tính đơn huỷ): {formatVnd(s.revenue_total)}</p>
        </section>

        <section aria-labelledby="status-h" className="border-2 border-line p-4">
          <h2 id="status-h" className="mb-3 text-xs font-bold tracking-widest uppercase">
            Đơn theo trạng thái
          </h2>
          <ul className="flex flex-col">
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((st) => (
              <li key={st}>
                <Link href={`/admin/orders?status=${st}`} className="flex min-h-11 items-center justify-between border-b border-line hover:bg-surface">
                  <span>{STATUS_LABEL[st]}</span>
                  <span className="font-bold">{s.by_status[st] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-10 xl:grid-cols-2">
        <section aria-labelledby="recent-h">
          <h2 id="recent-h" className="mb-3 text-2xl uppercase">
            Đơn mới
          </h2>
          {s.recent.length === 0 ? (
            <p className="text-muted">Chưa có đơn hàng.</p>
          ) : (
            <ul className="border-t border-line">
              {s.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-line py-3 hover:bg-surface">
                    <span className="font-mono font-bold">{o.code}</span>
                    <span className="text-right font-bold">{formatVnd(o.total)}</span>
                    <span className="text-sm text-muted">
                      {o.recipient_name} · {formatDateTime(o.created_at)}
                    </span>
                    <span className="text-right text-sm">{STATUS_LABEL[o.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="low-h">
          <h2 id="low-h" className="mb-3 text-2xl uppercase">
            Sắp hết hàng
          </h2>
          {s.low_stock.length === 0 ? (
            <p className="text-muted">Không có biến thể nào sắp hết.</p>
          ) : (
            <ul className="border-t border-line">
              {s.low_stock.map((v, i) => (
                <li key={`${v.product_id}-${v.size}-${v.color}-${i}`}>
                  <Link href={`/admin/products/${v.product_id}`} className="flex min-h-11 items-center justify-between gap-4 border-b border-line py-2 hover:bg-surface">
                    <span>
                      <span className="font-bold">{v.name}</span>
                      <span className="text-sm text-muted">
                        {" "}
                        · {v.color} / {v.size}
                      </span>
                    </span>
                    <span className={v.stock === 0 ? "font-bold text-danger" : "font-bold"}>{v.stock === 0 ? "Hết" : `Còn ${v.stock}`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
