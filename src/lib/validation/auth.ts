import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email({ error: "Email không hợp lệ" }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Vui lòng nhập mật khẩu" }).max(72),
});

const newPassword = z
  .string()
  .min(8, { error: "Mật khẩu tối thiểu 8 ký tự" })
  .max(72, { error: "Mật khẩu tối đa 72 ký tự" });

export const registerSchema = z
  .object({ email, password: newPassword, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { error: "Mật khẩu nhập lại không khớp", path: ["confirm"] });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { error: "Mật khẩu nhập lại không khớp", path: ["confirm"] });
