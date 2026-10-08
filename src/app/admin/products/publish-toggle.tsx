"use client";

import { useOptimistic, useTransition } from "react";
import { setProductPublished } from "./actions";

/** Quick hide/show switch with optimistic UI; reverts if the server rejects. */
export function PublishToggle({ id, name, published }: { id: string; name: string; published: boolean }) {
  const [value, setValue] = useOptimistic(published);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={`Hiển thị ${name}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setValue(!value);
          await setProductPublished(id, !value);
        })
      }
      className="inline-flex h-7 w-12 cursor-pointer items-center border-2 border-fg p-0.5 aria-checked:bg-accent-ink disabled:opacity-60"
    >
      <span className={`size-5 bg-fg transition-transform ${value ? "translate-x-5 bg-bg" : ""}`} />
    </button>
  );
}
