import "server-only";
import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { clientIp, rateKey } from "@/lib/rate-key";

const SECRET = process.env.RATE_LIMIT_SECRET;
if (!SECRET && process.env.NODE_ENV === "production") {
  console.error("[rate-limit] RATE_LIMIT_SECRET is not set: keys fall back to a weaker static pepper.");
}

export const LIMITS = {
  login: { limit: 10, windowSeconds: 5 * 60 },
  register: { limit: 5, windowSeconds: 60 * 60 },
  forgot: { limit: 5, windowSeconds: 60 * 60 },
} as const;

/** true = allowed. Fails open on infrastructure errors (logged) so an outage never locks every user out. */
export async function allowAttempt(action: keyof typeof LIMITS): Promise<boolean> {
  const { limit, windowSeconds } = LIMITS[action];
  const key = rateKey(action, clientIp(await headers()), SECRET ?? "clothes-shop-dev-pepper");
  const { data, error } = await createPublicClient().rpc("cs_rate_hit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  if (error) {
    console.error("[rate-limit] check failed:", error.message);
    return true;
  }
  return data === true;
}
