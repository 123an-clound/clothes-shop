import { z } from "zod";

// "+84 912 345 678" / "0912.345.678" -> "0912345678". Final check mirrors cs_place_order.
const phone = z
  .string()
  .transform((s) => s.replace(/[\s.\-()]/g, "").replace(/^\+?84/, "0"))
  .pipe(z.string().regex(/^0[0-9]{9}$/, { error: "Số điện thoại gồm 10 số, bắt đầu bằng 0" }));

const optional = (max: number) => z.string().trim().max(max, { error: `Tối đa ${max} ký tự` }).default("");

export const checkoutSchema = z.object({
  recipient_name: z.string().trim().min(2, { error: "Vui lòng nhập họ tên" }).max(100),
  phone,
  address_line: z.string().trim().min(5, { error: "Vui lòng nhập số nhà, tên đường" }).max(200),
  ward: optional(100),
  district: optional(100),
  province: z.string().trim().min(2, { error: "Vui lòng nhập tỉnh / thành phố" }).max(100),
  note: optional(500),
  payment_method: z.enum(["cod", "bank_transfer"], { error: "Chọn phương thức thanh toán" }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartItemsSchema = z
  .array(z.object({ variant_id: z.uuid(), quantity: z.number().int().min(1).max(20) }))
  .min(1, { error: "Giỏ hàng trống" })
  .max(50);
