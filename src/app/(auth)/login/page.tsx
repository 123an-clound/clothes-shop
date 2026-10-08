import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "../auth-form";
import { login } from "../actions";
import { LinkError } from "./link-error";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-5xl uppercase">Đăng nhập</h1>
      <Suspense>
        <LinkError />
        <AuthForm
          action={login}
          submitLabel="Đăng nhập"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Mật khẩu", type: "password", autoComplete: "current-password" },
          ]}
        />
      </Suspense>
      <div className="flex flex-col gap-2 text-sm text-muted">
        <Link href="/forgot-password" className="underline-offset-4 hover:text-fg hover:underline">
          Quên mật khẩu?
        </Link>
        <p>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold text-fg underline underline-offset-4">
            Đăng ký
          </Link>
        </p>
      </div>
    </>
  );
}
