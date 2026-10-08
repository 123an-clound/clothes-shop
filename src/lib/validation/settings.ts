import { z } from "zod";
import { isTrustedImageUrl } from "@/lib/images";

export const FONT_OPTIONS = ["space-grotesk", "inter", "be-vietnam-pro"] as const;
export const RADIUS_OPTIONS = ["none", "sm", "md"] as const;

/**
 * One set of field rules, two modes:
 * - read (lenient): every field falls back on its own, so one bad value never breaks the site;
 * - write (strict): admin input is rejected instead of silently repaired.
 */
function build(lenient: boolean) {
  const f = <T extends z.ZodType>(schema: T, fallback: z.output<T>) => (lenient ? schema.catch(fallback) : schema);
  const hex = (fallback: string) => f(z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Màu dạng #RRGGBB" }), fallback);
  const text = (max: number, fallback = "") => f(z.string().trim().max(max, { error: `Tối đa ${max} ký tự` }), fallback);
  // http(s) only: these values end up in href/src attributes.
  const httpUrl = f(z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "URL phải bắt đầu bằng https://" })]), "");
  const imageUrl = f(
    z.union([z.literal(""), z.string().refine(isTrustedImageUrl, { error: "Ảnh phải tải lên từ trang quản trị" })]),
    "",
  );

  const theme = z.object({
    accent: hex("#c6ff00"),
    background: hex("#0a0a0a"),
    foreground: hex("#f5f5f0"),
    font_display: f(z.enum(FONT_OPTIONS), "space-grotesk"),
    font_body: f(z.enum(FONT_OPTIONS), "inter"),
    radius: f(z.enum(RADIUS_OPTIONS), "none"),
    logo_url: imageUrl,
  });

  const store = z.object({
    name: f(z.string().trim().min(1, { error: "Nhập tên shop" }).max(60), "CLOTHES SHOP"),
    tagline: text(160, "Streetwear cho thế hệ không ngừng chuyển động."),
    email: f(z.union([z.literal(""), z.email({ error: "Email không hợp lệ" })]), ""),
    phone: text(20),
    address: text(200),
    facebook: httpUrl,
    instagram: httpUrl,
    tiktok: httpUrl,
  });

  const seo = z.object({
    title: text(70, "CLOTHES SHOP — Streetwear Việt Nam"),
    description: text(160, "Áo thun, hoodie, quần cargo và phụ kiện streetwear chính hãng. Giao hàng toàn quốc."),
    og_image: imageUrl,
  });

  const shipping = z.object({
    flat_fee: f(z.number().int().min(0).max(1_000_000), 30000),
    free_threshold: f(z.number().int().min(0).max(100_000_000), 500000),
  });

  const bank = z.object({
    bank_bin: f(z.union([z.literal(""), z.string().regex(/^\d{6}$/)]), ""),
    account_number: f(z.union([z.literal(""), z.string().regex(/^\d{4,20}$/, { error: "Số tài khoản 4–20 chữ số" })]), ""),
    account_name: text(100),
  });

  const banner = z.object({
    image_url: imageUrl,
    title: text(80),
    subtitle: text(200),
    cta_label: text(30),
    // Internal links only ("/shop", "/shop/ao-thun"): never an external or protocol-relative URL.
    cta_href: f(z.string().regex(/^\/(?![/\\])[\w\-/?=&%.]*$/, { error: "Đường dẫn nội bộ, ví dụ /shop" }), "/shop"),
  });

  const policies = z.object({ shipping: text(10000), returns: text(10000), privacy: text(10000) });

  const faqItem = z.object({
    q: z.string().trim().min(1, { error: "Nhập câu hỏi" }).max(200),
    a: z.string().trim().min(1, { error: "Nhập câu trả lời" }).max(2000),
  });

  return { theme, store, seo, shipping, bank, banners: f(z.array(banner).max(10), []), policies, faq: f(z.array(faqItem).max(30), []) };
}

const read = build(true);
/** Strict schemas for admin writes, keyed like cs_settings rows. */
export const settingsWrite = build(false);

export const themeSchema = read.theme;
export type SettingsKey = keyof typeof read;
export type Settings = { [K in SettingsKey]: z.output<(typeof read)[K]> };

/** Turns raw cs_settings rows into fully-populated, validated settings. */
export function parseSettings(rows: { key: string; value: unknown }[]): Settings {
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const pick = (key: SettingsKey) => {
    const raw = byKey.get(key);
    return key === "banners" || key === "faq" ? (raw ?? []) : raw && typeof raw === "object" ? raw : {};
  };
  return {
    theme: read.theme.parse(pick("theme")),
    store: read.store.parse(pick("store")),
    seo: read.seo.parse(pick("seo")),
    shipping: read.shipping.parse(pick("shipping")),
    bank: read.bank.parse(pick("bank")),
    banners: read.banners.parse(pick("banners")),
    policies: read.policies.parse(pick("policies")),
    faq: read.faq.parse(pick("faq")),
  };
}
