import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slugify";
import { contrastRatio } from "@/lib/color";
import { dbErrorMessage } from "@/lib/db-errors";
import { categoryInput, productInput } from "@/lib/validation/admin";
import { settingsWrite, parseSettings } from "@/lib/validation/settings";

describe("slugify", () => {
  it("strips Vietnamese diacritics and đ", () => {
    expect(slugify("Áo Thun Đen — Oversized 2026!")).toBe("ao-thun-den-oversized-2026");
    expect(slugify("  Quần   cargo  ")).toBe("quan-cargo");
    expect(slugify("!!!")).toBe("");
  });
});

const variant = { size: "M", color: "Đen", color_hex: "#111111", sku: "TEE-M-1", price: null, stock: 3 };
const product = {
  name: "Tee",
  slug: "tee",
  description: "",
  category_id: "",
  price: 200000,
  compare_at_price: null,
  is_published: true,
  is_featured: false,
  variants: [variant],
  images: [{ url: "https://images.unsplash.com/photo-1", alt: "", color: "" }],
};

describe("productInput (strict)", () => {
  it("accepts a valid product", () => expect(productInput.safeParse(product).success).toBe(true));
  it("rejects compare price <= price, bad slug, duplicate size/color, duplicate sku", () => {
    expect(productInput.safeParse({ ...product, compare_at_price: 100000 }).success).toBe(false);
    expect(productInput.safeParse({ ...product, slug: "Áo thun" }).success).toBe(false);
    expect(productInput.safeParse({ ...product, variants: [variant, { ...variant, sku: "X" }] }).success).toBe(false);
    expect(productInput.safeParse({ ...product, variants: [variant, { ...variant, size: "L" }] }).success).toBe(false);
  });
  it("only allows images from trusted hosts", () => {
    const bad = { ...product, images: [{ url: "https://evil.example/x.png", alt: "", color: "" }] };
    expect(productInput.safeParse(bad).success).toBe(false);
    const js = { ...product, images: [{ url: "javascript:alert(1)", alt: "", color: "" }] };
    expect(productInput.safeParse(js).success).toBe(false);
  });
  it("requires at least one variant", () => {
    expect(productInput.safeParse({ ...product, variants: [] }).success).toBe(false);
  });
});

describe("categoryInput", () => {
  it("validates slug and name", () => {
    expect(categoryInput.safeParse({ name: "Áo", slug: "ao", description: "", image_url: "", sort_order: 1, is_featured: false }).success).toBe(true);
    expect(categoryInput.safeParse({ name: "", slug: "ao", description: "", image_url: "", sort_order: 1, is_featured: false }).success).toBe(false);
  });
});

describe("settings write vs read", () => {
  it("write rejects what read silently repairs", () => {
    expect(settingsWrite.theme.safeParse({ ...parseSettings([]).theme, accent: "red" }).success).toBe(false);
    expect(parseSettings([{ key: "theme", value: { accent: "red" } }]).theme.accent).toBe("#c6ff00");
  });
  it("write accepts the defaults", () => {
    const d = parseSettings([]);
    for (const key of Object.keys(settingsWrite) as (keyof typeof settingsWrite)[]) {
      expect(settingsWrite[key].safeParse(d[key]).success, key).toBe(true);
    }
  });
});

describe("contrastRatio", () => {
  it("matches WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#c6ff00", "#0a0a0a")).toBeGreaterThan(4.5);
    expect(contrastRatio("#3d5a00", "#0a0a0a")).toBeLessThan(4.5);
  });
});

describe("dbErrorMessage", () => {
  it("maps unique violations by constraint", () => {
    expect(dbErrorMessage({ code: "23505", message: 'duplicate key value violates unique constraint "cs_products_slug_key"' })).toMatch(/slug/i);
    expect(dbErrorMessage({ code: "23505", message: 'violates unique constraint "cs_variants_sku_key"' })).toMatch(/SKU/);
    expect(dbErrorMessage({ code: "XX000", message: "secret internals" })).not.toMatch(/secret/);
  });
});
