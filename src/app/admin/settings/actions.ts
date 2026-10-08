"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { settingsWrite, type SettingsKey } from "@/lib/validation/settings";
import { requireAdmin } from "@/services/auth";
import { SETTINGS_TAG } from "@/services/settings";

export type SettingsResult = { ok?: boolean; message?: string; errors?: Record<string, string[]> };

/** Saves one cs_settings row. The live site picks it up immediately (cache tag), no redeploy. */
export async function saveSettings(key: unknown, value: unknown): Promise<SettingsResult> {
  await requireAdmin();
  const k = z.enum(Object.keys(settingsWrite) as [SettingsKey, ...SettingsKey[]]).safeParse(key);
  if (!k.success) return { message: "Mục cài đặt không hợp lệ." };

  const parsed = settingsWrite[k.data].safeParse(value);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) (errors[issue.path.join(".") || "_"] ??= []).push(issue.message);
    return { errors, message: "Vui lòng sửa các ô được đánh dấu." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cs_settings").upsert({ key: k.data, value: parsed.data });
  if (error) return { message: dbErrorMessage(error) };

  updateTag(SETTINGS_TAG);
  return { ok: true, message: "Đã lưu. Website đã cập nhật." };
}
