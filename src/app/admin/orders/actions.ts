"use server";

import { updateTag } from "next/cache";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { orderUpdateInput } from "@/lib/validation/admin";
import { requireAdmin } from "@/services/auth";
import { CATALOG_TAG } from "@/services/catalog";

export async function updateOrder(input: unknown): Promise<{ ok?: boolean; message: string }> {
  await requireAdmin();
  const parsed = orderUpdateInput.safeParse(input);
  if (!parsed.success) return { message: "Dữ liệu không hợp lệ." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cs_admin_update_order", {
    p_order_id: parsed.data.order_id,
    p_status: parsed.data.status,
    p_payment_status: parsed.data.payment_status,
  });
  if (error) {
    if (error.message === "INVALID_TRANSITION") return { message: "Đơn đã hoàn thành hoặc đã huỷ thì không đổi trạng thái được nữa." };
    return { message: dbErrorMessage(error) };
  }

  // Cancelling restocks variants: refresh storefront stock.
  if (parsed.data.status === "cancelled") updateTag(CATALOG_TAG);
  return { ok: true, message: "Đã cập nhật đơn hàng." };
}
