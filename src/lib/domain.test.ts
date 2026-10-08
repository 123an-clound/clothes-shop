import { describe, expect, it } from "vitest";
import { formatVnd } from "@/lib/money";
import { calcShippingFee } from "@/lib/shipping";
import { safeNextPath } from "@/lib/safe-next";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { parseSettings, themeSchema } from "@/lib/validation/settings";

describe("formatVnd", () => {
  it("formats integer VND with dot separators", () => {
    expect(formatVnd(1250000).replace(/\s/g, " ")).toBe("1.250.000 ₫");
    expect(formatVnd(0).replace(/\s/g, " ")).toBe("0 ₫");
  });
});

describe("calcShippingFee (mirrors cs_place_order)", () => {
  const cfg = { flat_fee: 30000, free_threshold: 500000 };
  it("charges flat fee below threshold", () => expect(calcShippingFee(499999, cfg)).toBe(30000));
  it("is free at threshold", () => expect(calcShippingFee(500000, cfg)).toBe(0));
});

describe("safeNextPath", () => {
  it("accepts same-origin relative paths", () => {
    expect(safeNextPath("/account")).toBe("/account");
    expect(safeNextPath("/shop?size=M")).toBe("/shop?size=M");
  });
  it("rejects open redirects", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", null]) {
      expect(safeNextPath(bad)).toBe("/");
    }
  });
});

describe("auth schemas", () => {
  it("rejects bad email and short password", () => {
    expect(loginSchema.safeParse({ email: "x", password: "" }).success).toBe(false);
  });
  it("requires matching confirm and >= 8 chars", () => {
    expect(registerSchema.safeParse({ email: "a@b.vn", password: "1234567", confirm: "1234567" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "a@b.vn", password: "12345678", confirm: "12345679" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "A@B.vn ", password: "12345678", confirm: "12345678" }).data?.email).toBe("a@b.vn");
  });
});

describe("settings", () => {
  it("never lets CSS injection through theme colors", () => {
    expect(themeSchema.parse({ accent: "red;}body{display:none" }).accent).toBe("#c6ff00");
  });
  it("falls back to defaults for missing or invalid rows", () => {
    const s = parseSettings([{ key: "shipping", value: { flat_fee: "abc" } }]);
    expect(s.shipping).toEqual({ flat_fee: 30000, free_threshold: 500000 });
    expect(s.theme.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(s.store.name).toBe("CLOTHES SHOP");
  });
});
