import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { parseSettings, type Settings } from "@/lib/validation/settings";

export const SETTINGS_TAG = "settings";

/** Public site settings, cached until an admin save calls updateTag(SETTINGS_TAG). */
export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("days");

  const { data, error } = await createPublicClient().from("cs_settings").select("key, value");
  if (error) console.error("[settings] load failed, using defaults:", error.message);
  return parseSettings(data ?? []);
}
