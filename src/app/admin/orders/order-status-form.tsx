"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/form";
import type { OrderStatus, PaymentStatus } from "@/services/orders";
import { updateOrder } from "./actions";

const STATUS: [OrderStatus, string][] = [
  ["pending", "Chờ xác nhận"],
  ["confirmed", "Đã xác nhận"],
  ["shipping", "Đang giao"],
  ["completed", "Hoàn thành"],
  ["cancelled", "Đã huỷ (hoàn kho)"],
];

export function OrderStatusForm({ orderId, status, paymentStatus }: { orderId: string; status: OrderStatus; paymentStatus: PaymentStatus }) {
  const router = useRouter();
  const [next, setNext] = useState(status);
  const [paid, setPaid] = useState(paymentStatus);
  const [msg, setMsg] = useState<{ ok?: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = status === "cancelled" || status === "completed";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next === "cancelled" && status !== "cancelled" && !window.confirm("Huỷ đơn này? Tồn kho sẽ được hoàn lại và không thể mở lại đơn.")) return;
    startTransition(async () => {
      const r = await updateOrder({ order_id: orderId, status: next, payment_status: paid });
      setMsg(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 border-2 border-fg p-5">
      <h2 className="text-2xl uppercase">Cập nhật</h2>
      <SelectField
        label="Trạng thái đơn"
        value={next}
        onChange={(e) => setNext(e.target.value as OrderStatus)}
        disabled={locked}
        hint={locked ? "Đơn đã kết thúc, chỉ còn đổi được trạng thái thanh toán." : undefined}
      >
        {STATUS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </SelectField>
      <SelectField label="Thanh toán" value={paid} onChange={(e) => setPaid(e.target.value as PaymentStatus)}>
        <option value="unpaid">Chưa thanh toán</option>
        <option value="paid">Đã thanh toán</option>
      </SelectField>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "" : "text-danger"}`}>
          {msg.message}
        </p>
      )}
      <Button type="submit" disabled={pending || (next === status && paid === paymentStatus)}>
        {pending ? "Đang lưu…" : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
