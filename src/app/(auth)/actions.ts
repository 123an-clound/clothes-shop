"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "@/lib/validation/auth";
import { allowAttempt } from "@/services/rate-limit";

export type FormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  ok?: boolean;
  /** Client does a full page load here: clears preserved (Activity) state from the previous session. */
  redirectTo?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TOO_MANY: FormState = { message: "Bạn thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại." };

function fieldErrors(error: z.ZodError): FormState {
  return { errors: z.flattenError(error).fieldErrors };
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  if (!(await allowAttempt("login"))) return TOO_MANY;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Generic message: do not reveal whether the email exists.
    return {
      message:
        error.code === "email_not_confirmed"
          ? "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư."
          : "Email hoặc mật khẩu không đúng.",
    };
  }
  return { redirectTo: safeNextPath(formData.get("next")) };
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  if (!(await allowAttempt("register"))) return TOO_MANY;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=/account` },
  });
  if (error) {
    if (error.code === "weak_password") return { errors: { password: ["Mật khẩu quá yếu, hãy chọn mật khẩu khác."] } };
    if (error.status === 429) return { message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút." };
    console.error("[auth] signUp failed:", error.code, error.message);
    return { message: "Không thể tạo tài khoản lúc này. Vui lòng thử lại." };
  }
  // Same response whether or not the email already exists (prevents account enumeration).
  return { ok: true, message: "Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản." };
}

export async function forgotPassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  if (!(await allowAttempt("forgot"))) return TOO_MANY;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
  });
  if (error?.status === 429) return { message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút." };
  if (error) console.error("[auth] reset email failed:", error.code, error.message);
  return { ok: true, message: "Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu." };
}

export async function resetPassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { message: "Liên kết đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu lần nữa." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { errors: { password: ["Mật khẩu mới phải khác mật khẩu cũ."] } };
    if (error.code === "weak_password") return { errors: { password: ["Mật khẩu quá yếu, hãy chọn mật khẩu khác."] } };
    return { message: "Không thể đổi mật khẩu. Vui lòng thử lại." };
  }
  return { redirectTo: "/account" };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
