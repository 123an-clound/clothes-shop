import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/ui/form";
import { formatDateTime } from "@/lib/format-date";
import { formatVnd } from "@/lib/money";
import { getAdminOrder } from "@/services/admin";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/services/orders";
import { OrderStatusForm } from "../order-status-form";

export const metadata: Metadata = { title: "Chi tiết đơn" };

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const address = [order.address_line, order.ward, order.district, order.province].filter(Boolean).join(", ");

  return (
    <>
      <PageHeader title={`Đơn ${order.code}`}>
        <Link href="/admin/orders" className="min-h-11 content-center text-sm font-bold underline underline-offset-4">
          ← Danh sách đơn
        </Link>
      </PageHeader>
      <div className="grid gap-10 xl:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-8">
          <p className="text-muted">
            Đặt lúc {formatDateTime(order.created_at)} · cập nhật {formatDateTime(order.updated_at)} ·{" "}
            <strong className="text-fg">{STATUS_LABEL[order.status]}</strong>
          </p>

          <section aria-labelledby="items-h">
            <h2 id="items-h" className="mb-3 text-2xl uppercase">
              Sản phẩm
            </h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-fg text-xs text-muted uppercase">
                  <th className="py-2">Sản phẩm</th>
                  <th className="py-2 text-right">Đơn giá</th>
                  <th className="py-2 text-right">SL</th>
                  <th className="py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.cs_order_items.map((i) => (
                  <tr key={i.id} className="border-b border-line">
                    <td className="py-2">
                      <span className="font-bold">{i.product_name}</span>
                      <span className="block text-xs text-muted">
                        {i.color} / {i.size}
                      </span>
                    </td>
                    <td className="py-2 text-right">{formatVnd(i.unit_price)}</td>
                    <td className="py-2 text-right">{i.quantity}</td>
                    <td className="py-2 text-right font-bold">{formatVnd(i.unit_price * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-right text-muted">
                    Tạm tính
                  </td>
                  <td className="pt-3 text-right">{formatVnd(order.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right text-muted">
                    Phí giao hàng
                  </td>
                  <td className="text-right">{order.shipping_fee === 0 ? "Miễn phí" : formatVnd(order.shipping_fee)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="pt-2 text-right text-lg font-bold">
                    Tổng cộng
                  </td>
                  <td className="pt-2 text-right text-lg font-bold">{formatVnd(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section aria-labelledby="cust-h" className="grid gap-1">
            <h2 id="cust-h" className="mb-2 text-2xl uppercase">
              Giao hàng
            </h2>
            <p className="font-bold">{order.recipient_name}</p>
            <p>
              <a href={`tel:${order.phone}`} className="underline underline-offset-4">
                {order.phone}
              </a>
            </p>
            <p className="text-muted">{address}</p>
            {order.note && <p className="mt-2 border-l-4 border-line pl-3 text-sm">Ghi chú: {order.note}</p>}
            <p className="mt-2 text-sm">{PAYMENT_LABEL[order.payment_method]}</p>
            {order.payment_method === "bank_transfer" && (
              <p className="text-sm text-muted">
                Đối soát: nội dung chuyển khoản phải là <strong className="font-mono text-fg">{order.code}</strong>, số tiền {formatVnd(order.total)}.
              </p>
            )}
          </section>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <OrderStatusForm orderId={order.id} status={order.status} paymentStatus={order.payment_status} />
        </div>
      </div>
    </>
  );
}
