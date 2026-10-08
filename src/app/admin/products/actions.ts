"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { productInput } from "@/lib/validation/admin";
import { requireAdmin } from "@/services/auth";
import { CATALOG_TAG } from "@/services/catalog";

export type SaveProductResult = { ok?: boolean; id?: string; message?: string; errors?: Record<string, string[] | undefined> };

export async function saveProduct(input: unknown): Promise<SaveProductResult> {
  await requireAdmin();
  const parsed = productInput.safeParse(input);
  if (!parsed.success) {
    // Flatten nested paths ("variants.2.sku") so the form can show errors next to the right cell.
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      (errors[key] ??= []).push(issue.message);
    }
    return { errors, message: "Vui lòng sửa các ô được đánh dấu." };
  }

  const supabase = await createClient();
  // One transaction in the DB: product + variants diff + gallery. Admin is re-checked there.
  const { data, error } = await supabase.rpc("cs_admin_save_product", { p: parsed.data });
  if (error || !data) return { message: dbErrorMessage(error) };

  updateTag(CATALOG_TAG);
  return { ok: true, id: data, message: "Đã lưu sản phẩm." };
}

export async function setProductPublished(id: unknown, published: unknown): Promise<SaveProductResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.uuid(), published: z.boolean() }).safeParse({ id, published });
  if (!parsed.success) return { message: "Dữ liệu không hợp lệ." };

  const supabase = await createClient();
  const { error } = await supabase.from("cs_products").update({ is_published: parsed.data.published }).eq("id", parsed.data.id);
  if (error) return { message: dbErrorMessage(error) };

  updateTag(CATALOG_TAG);
  return { ok: true };
}

export async function deleteProduct(id: unknown): Promise<SaveProductResult & { imageUrls?: string[] }> {
  await requireAdmin();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { message: "Sản phẩm không hợp lệ." };

  const supabase = await createClient();
  const { data: images } = await supabase.from("cs_product_images").select("url").eq("product_id", parsed.data);
  // Past orders keep their line snapshots (order_items.variant_id -> null).
  const { error } = await supabase.from("cs_products").delete().eq("id", parsed.data);
  if (error) return { message: dbErrorMessage(error) };

  updateTag(CATALOG_TAG);
  return { ok: true, imageUrls: images?.map((i) => i.url) ?? [] };
}
