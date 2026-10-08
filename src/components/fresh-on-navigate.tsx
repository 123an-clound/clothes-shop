"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";

/**
 * Next 16 keeps visited routes alive (hidden <Activity>). Wrap flows that must start fresh on each
 * push/replace visit (new product, checkout) so stale drafts/messages never reappear.
 * Back/forward still restores the previous state.
 */
export function FreshOnNavigate({ children }: { children: React.ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
