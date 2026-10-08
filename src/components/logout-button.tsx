"use client";

import { useTransition } from "react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

/** Full page load after sign-out so no preserved route state (drafts, prefilled forms) leaks to the next user. */
export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logout();
          // Intentional hard navigation (Next "Preserving UI state" guide): soft navigation would keep the
          // previous user's preserved routes alive in the browser.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/");
        })
      }
    >
      {pending ? "Đang đăng xuất…" : "Đăng xuất"}
    </Button>
  );
}
