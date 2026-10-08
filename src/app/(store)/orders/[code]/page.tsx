import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";
import { formatVnd } from "@/lib/money";
import { getOrderByCode, PAYMENT_LABEL, STATUS_LABEL } from "@/services/orders";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Đơn hàng", robots: { index: false, follow: false } };

export default function OrderPage({ params, searchParams }: PageProps<"/orders/[code]">) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-8">
      <Suspense fallback={<p className="text-muted">Đang tải đơn hàng…</p>}>
        <OrderDetail params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderDetail({ params, searchParams }: Pick<PageProps<"/orders/[code]">, "params" | "searchParams">) {
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const [order, { bank }] = await Promise.all([getOrderByCode(code), getSettings()]);
  if (!order) notFound();

  const isNew = sp.new === "1";
  const showQr = order.payment_method === "bank_transfer" && order.payment_status === "unpaid" && order.status !== "cancelled";
  const bankReady = Boolean(bank.bank_bin && bank.account_number);
  const qrUrl =
    `https://img.vietqr.io/image/${bank.bank_bin}-${bank.account_number}-compact2.png` +
    `?amount=${order.total}&addInfo=${encodeURIComponent(order.code)}&accountName=${encodeURIComponent(bank.account_name)}`;
  const address = [order.address_line, order.ward, order.district, order.province].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        {isNew && (
          <p role="status" className="w-fit bg-accent px-3 py-1 text-sm font-bold text-on-accent uppercase">
            Đặt hàng thành công
          </p>
        )}
        <h1 className="text-4xl uppercase sm:text-7xl">
          Đơn <span className="break-all">{order.code}</span>
        </h1>
        <p className="text-muted">
          Đặt lúc {formatDateTime(order.created_at)} · <strong className="text-fg">{STATUS_LABEL[order.status]}</strong>
          {" · "}
          {order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
        </p>
      </header>

      {showQr && (
        <section aria-labelledby="pay-h" className="grid gap-6 border-2 border-fg p-6 sm:grid-cols-[auto_1fr]">
          {bankReady ? (
            <>
              <Image
                src={qrUrl}
                alt={`Mã VietQR chuyển khoản ${formatVnd(order.total)} cho đơn ${order.code}`}
                width={240}
                height={240}
                unoptimized
                className="bg-white"
              />
              <div className="flex flex-col gap-2">
                <h2 id="pay-h" className="text-2xl uppercase">
                  Quét mã để thanh toán
                </h2>
                <p>
                  Số tiền: <strong>{formatVnd(order.total)}</strong>
                </p>
                <p>
                  Nội dung: <strong className="font-mono">{order.code}</strong>
                </p>
                <p>
                  Tài khoản: <strong>{bank.account_number}</strong> — {bank.account_name}
                </p>
                <p className="text-sm text-muted">Đơn được xác nhận sau khi shop nhận được tiền. Vui lòng giữ nguyên nội dung chuyển khoản.</p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <h2 id="pay-h" className="text-2xl uppercase">
                Chuyển khoản
              </h2>
              <p className="text-muted">Shop sẽ liên hệ gửi thông tin chuyển khoản cho bạn sớm nhất.</p>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="items-h">
        <h2 id="items-h" className="mb-4 text-2xl uppercase">
          Sản phẩm
        </h2>
        <ul className="border-t border-line">
          {order.cs_order_items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 border-b border-line py-3">
              <span>
                <span className="font-bold uppercase">{i.product_name}</span>
                <span className="block text-sm text-muted">
                  {i.color} / {i.size} × {i.quantity}
                </span>
              </span>
              <span className="font-bold">{formatVnd(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid grid-cols-[1fr_auto] gap-2 text-sm">
          <dt className="text-muted">Tạm tính</dt>
          <dd>{formatVnd(order.subtotal)}</dd>
          <dt className="text-muted">Phí giao hàng</dt>
          <dd>{order.shipping_fee === 0 ? "Miễn phí" : formatVnd(order.shipping_fee)}</dd>
          <dt className="border-t-2 border-fg pt-2 text-lg font-bold">Tổng cộng</dt>
          <dd className="border-t-2 border-fg pt-2 text-lg font-bold">{formatVnd(order.total)}</dd>
        </dl>
      </section>

      <section aria-labelledby="ship-h" className="grid gap-2">
        <h2 id="ship-h" className="mb-2 text-2xl uppercase">
          Giao tới
        </h2>
        <p className="font-bold">
          {order.recipient_name} · {order.phone}
        </p>
        <p className="text-muted">{address}</p>
        {order.note && <p className="text-sm text-muted">Ghi chú: {order.note}</p>}
        <p className="text-sm">{PAYMENT_LABEL[order.payment_method]}</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/shop" className={buttonClass("primary")}>
          Tiếp tục mua sắm
        </Link>
        <Link href="/account" className={buttonClass("outline")}>
          Đơn hàng của tôi
        </Link>
      </div>
    </div>
  );
}
