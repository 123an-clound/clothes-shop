import { describe, expect, it } from "vitest";
import { clientIp, rateKey } from "@/lib/rate-key";

const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n] ?? null });

describe("rateKey", () => {
  it("matches the DB format and depends on the secret", () => {
    const k = rateKey("login", "1.2.3.4", "s1");
    expect(k).toMatch(/^[a-z_]{1,20}:[0-9a-f]{64}$/);
    expect(k).not.toContain("1.2.3.4");
    expect(rateKey("login", "1.2.3.4", "s2")).not.toBe(k);
    expect(rateKey("register", "1.2.3.4", "s1")).not.toBe(k);
  });
});

describe("clientIp", () => {
  it("takes the first forwarded hop", () => {
    expect(clientIp(headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(clientIp(headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientIp(headers({}))).toBe("unknown");
  });
});
