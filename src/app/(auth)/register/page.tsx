import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "../auth-form";
import { register } from "../actions";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-5xl uppercase">Tạo tài khoản</h1>
      <Suspense>
        <AuthForm
          action={register}
          submitLabel="Đăng ký"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            {
              name: "password",
              label: "Mật khẩu",
              type: "password",
              autoComplete: "new-password",
              hint: "Tối thiểu 8 ký tự.",
            },
            { name: "confirm", label: "Nhập lại mật khẩu", type: "password", autoComplete: "new-password" },
          ]}
        />
      </Suspense>
      <p className="text-sm text-muted">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-bold text-fg underline underline-offset-4">
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
