"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { categoryInput } from "@/lib/validation/admin";
import { requireAdmin } from "@/services/auth";
import { CATALOG_TAG } from "@/services/catalog";

export type ActionResult = { ok?: boolean; message?: string; errors?: Record<string, string[] | undefined> };

export async function saveCategory(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryInput.safeParse(input);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const { id, image_url, ...rest } = parsed.data;
  const row = { ...rest, image_url: image_url || null };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("cs_categories").update(row).eq("id", id)
    : await supabase.from("cs_categories").insert(row);
  if (error) return { message: dbErrorMessage(error) };

  updateTag(CATALOG_TAG);
  return { ok: true, message: "Đã lưu danh mục." };
}

export async function deleteCategory(id: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { message: "Danh mục không hợp lệ." };

  const supabase = await createClient();
  // Products keep existing; their category becomes empty (FK on delete set null).
  const { error } = await supabase.from("cs_categories").delete().eq("id", parsed.data);
  if (error) return { message: dbErrorMessage(error) };

  updateTag(CATALOG_TAG);
  return { ok: true, message: "Đã xoá danh mục." };
}
