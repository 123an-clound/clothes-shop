import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { requireUser } from "./auth";

export type OrderStatus = Database["public"]["Enums"]["cs_order_status"];
export type PaymentMethod = Database["public"]["Enums"]["cs_payment_method"];
export type PaymentStatus = Database["public"]["Enums"]["cs_payment_status"];

export const ORDER_CODE = /^CS\d{6}[0-9A-F]{6}$/;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
};

export async function getMyProfile() {
  const user = await requireUser("/checkout");
  const supabase = await createClient();
  const { data } = await supabase
    .from("cs_profiles")
    .select("full_name, phone, address_line, ward, district, province")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

export async function getMyOrders() {
  const user = await requireUser("/account");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cs_orders")
    .select("id, code, status, payment_method, payment_status, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`orders: ${error.message}`);
  return data;
}

/** RLS limits this to the signed-in user's own orders (or admins). */
export async function getOrderByCode(code: string) {
  await requireUser(`/orders/${code}`);
  if (!ORDER_CODE.test(code)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cs_orders")
    .select(
      "id, code, status, payment_method, payment_status, recipient_name, phone, address_line, ward, district, province, note, " +
        "subtotal, shipping_fee, total, created_at, cs_order_items(id, product_name, size, color, unit_price, quantity)",
    )
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(`order: ${error.message}`);
  return data as unknown as OrderDetail | null;
}

export type OrderDetail = {
  id: string;
  code: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  recipient_name: string;
  phone: string;
  address_line: string;
  ward: string;
  district: string;
  province: string;
  note: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: string;
  cs_order_items: { id: string; product_name: string; size: string; color: string; unit_price: number; quantity: number }[];
};
