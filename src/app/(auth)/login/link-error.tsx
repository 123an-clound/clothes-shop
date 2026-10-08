"use client";

import { useSearchParams } from "next/navigation";

export function LinkError() {
  if (useSearchParams().get("error") !== "link") return null;
  return (
    <p role="alert" className="border-l-4 border-danger pl-3 text-sm text-danger">
      Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.
    </p>
  );
}
