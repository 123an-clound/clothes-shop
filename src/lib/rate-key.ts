import { createHmac } from "node:crypto";

/** "<action>:<hex hmac-sha256(secret, ip)>" — format required by cs_rate_hit. Raw IPs are never stored. */
export function rateKey(action: string, ip: string, secret: string): string {
  return `${action}:${createHmac("sha256", secret).update(ip).digest("hex")}`;
}

/** First hop of x-forwarded-for (set by Vercel's edge), else x-real-ip, else a constant. */
export function clientIp(h: { get(name: string): string | null }): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}
