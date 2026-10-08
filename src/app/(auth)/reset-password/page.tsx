import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../auth-form";
import { resetPassword } from "../actions";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-5xl uppercase">Mật khẩu mới</h1>
      <Suspense>
        <AuthForm
          action={resetPassword}
          submitLabel="Lưu mật khẩu"
          fields={[
            { name: "password", label: "Mật khẩu mới", type: "password", autoComplete: "new-password", hint: "Tối thiểu 8 ký tự." },
            { name: "confirm", label: "Nhập lại mật khẩu", type: "password", autoComplete: "new-password" },
          ]}
        />
      </Suspense>
    </>
  );
}
