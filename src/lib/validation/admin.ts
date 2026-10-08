import { z } from "zod";
import { isTrustedImageUrl } from "@/lib/images";

const slug = z
  .string()
  .trim()
  .min(1, { error: "Nhập slug" })
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Chỉ chữ thường không dấu, số và dấu gạch ngang" });
const optionalId = z.union([z.literal(""), z.uuid()]).optional();
const money = z.number({ error: "Nhập số" }).int({ error: "Số nguyên" }).min(0).max(100_000_000);
const trustedImage = z.string().refine(isTrustedImageUrl, { error: "Ảnh phải tải lên từ trang quản trị" });

export const variantInput = z.object({
  id: optionalId,
  size: z.string().trim().min(1, { error: "Nhập size" }).max(20),
  color: z.string().trim().min(1, { error: "Nhập màu" }).max(50),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Mã màu #RRGGBB" }),
  sku: z.string().trim().min(1, { error: "Nhập SKU" }).max(64).regex(/^[A-Za-z0-9_-]+$/, { error: "SKU chỉ gồm chữ, số, - và _" }),
  price: money.nullable(),
  stock: z.number({ error: "Nhập số" }).int().min(0).max(100_000),
});

export const productInput = z
  .object({
    id: optionalId,
    name: z.string().trim().min(1, { error: "Nhập tên sản phẩm" }).max(150),
    slug,
    description: z.string().trim().max(5000),
    category_id: z.union([z.literal(""), z.uuid()]),
    price: money,
    compare_at_price: money.nullable(),
    is_published: z.boolean(),
    is_featured: z.boolean(),
    variants: z.array(variantInput).min(1, { error: "Cần ít nhất 1 biến thể" }).max(100),
    images: z
      .array(z.object({ url: trustedImage, alt: z.string().trim().max(200), color: z.string().trim().max(50) }))
      .max(20, { error: "Tối đa 20 ảnh" }),
  })
  .superRefine((p, ctx) => {
    if (p.compare_at_price !== null && p.compare_at_price <= p.price) {
      ctx.addIssue({ code: "custom", path: ["compare_at_price"], message: "Giá gốc phải lớn hơn giá bán" });
    }
    const pairs = new Set<string>();
    const skus = new Set<string>();
    p.variants.forEach((v, i) => {
      const pair = `${v.size.toLowerCase()}|${v.color.toLowerCase()}`;
      if (pairs.has(pair)) ctx.addIssue({ code: "custom", path: ["variants", i, "size"], message: "Trùng size + màu" });
      if (skus.has(v.sku)) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "Trùng SKU" });
      pairs.add(pair);
      skus.add(v.sku);
    });
  });

export type ProductInput = z.infer<typeof productInput>;

export const categoryInput = z.object({
  id: optionalId,
  name: z.string().trim().min(1, { error: "Nhập tên danh mục" }).max(80),
  slug,
  description: z.string().trim().max(1000),
  image_url: z.union([z.literal(""), trustedImage]),
  sort_order: z.number().int().min(0).max(1000),
  is_featured: z.boolean(),
});

export type CategoryInput = z.infer<typeof categoryInput>;

export const orderUpdateInput = z.object({
  order_id: z.uuid(),
  status: z.enum(["pending", "confirmed", "shipping", "completed", "cancelled"]),
  payment_status: z.enum(["unpaid", "paid"]),
});
