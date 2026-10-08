"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { VariantQuote } from "@/lib/cart";
import { orderErrorMessage } from "@/lib/order-errors";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { cartItemsSchema, checkoutSchema } from "@/lib/validation/checkout";
import { getCurrentUser } from "@/services/auth";
import { CATALOG_TAG } from "@/services/catalog";

/** Fresh price/stock for cart lines (uncached). Unpublished or unknown variants are simply absent. */
export async function quoteVariants(ids: unknown): Promise<VariantQuote[]> {
  const parsed = z.array(z.uuid()).max(50).safeParse(ids);
  if (!parsed.success || parsed.data.length === 0) return [];

  const { data, error } = await createPublicClient()
    .from("cs_variants")
    .select("id, price, stock, cs_products!inner(price, is_published)")
    .in("id", parsed.data)
    .eq("cs_products.is_published", true);
  if (error) throw new Error("Không tải được giỏ hàng. Vui lòng thử lại.");
  return data.map((v) => ({ variantId: v.id, price: v.price ?? v.cs_products.price, stock: v.stock }));
}

export type PlaceOrderState = {
  ok?: boolean;
  code?: string;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  /** Set when the DB rejected the cart contents, so the client re-quotes. */
  cartChanged?: boolean;
};

export async function placeOrder(_: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  const user = await getCurrentUser();
  if (!user) return { message: orderErrorMessage("UNAUTHENTICATED") };

  const fields = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) return { errors: z.flattenError(fields.error).fieldErrors };

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    rawItems = null;
  }
  const items = cartItemsSchema.safeParse(rawItems);
  if (!items.success) return { message: "Giỏ hàng trống hoặc không hợp lệ.", cartChanged: true };

  const { payment_method, ...shipping } = fields.data;
  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("cs_place_order", {
    p_items: items.data,
    p_shipping: shipping,
    p_payment_method: payment_method,
  });

  if (error || !code) {
    const dbCode = error?.message ?? "";
    if (!["OUT_OF_STOCK", "NOT_FOUND", "RATE_LIMITED", "INVALID_INPUT", "UNAUTHENTICATED"].includes(dbCode)) {
      console.error("[checkout] place order failed:", error?.code, error?.message);
    }
    return { message: orderErrorMessage(dbCode), cartChanged: dbCode === "OUT_OF_STOCK" || dbCode === "NOT_FOUND" };
  }

  if (formData.get("save_address") === "on") {
    const { error: profileError } = await supabase.from("cs_profiles").upsert({
      id: user.id,
      full_name: shipping.recipient_name,
      phone: shipping.phone,
      address_line: shipping.address_line,
      ward: shipping.ward,
      district: shipping.district,
      province: shipping.province,
    });
    // The order already succeeded; a failed profile save must not fail checkout.
    if (profileError) console.error("[checkout] save profile failed:", profileError.message);
  }

  // Stock changed: refresh cached catalog pages immediately.
  updateTag(CATALOG_TAG);
  return { ok: true, code };
}
