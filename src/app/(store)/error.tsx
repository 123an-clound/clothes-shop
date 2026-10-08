"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StoreError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24">
      <h1 className="text-4xl uppercase sm:text-6xl">Có lỗi xảy ra</h1>
      <p className="text-muted">Không tải được dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.</p>
      <Button type="button" onClick={() => retry()}>
        Thử lại
      </Button>
    </div>
  );
}
