import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../auth-form";
import { forgotPassword } from "../actions";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-5xl uppercase">Quên mật khẩu</h1>
      <p className="text-muted">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
      <Suspense>
        <AuthForm
          action={forgotPassword}
          submitLabel="Gửi liên kết"
          fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        />
      </Suspense>
    </>
  );
}
