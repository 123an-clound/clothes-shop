"use client";

import { MoonIcon, SunIcon } from "@/components/icons";

/** Stateless: which icon shows is decided by CSS on [data-theme], so SSR and client always match. */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode: the choice just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Đổi giao diện sáng / tối"
      className="grid size-11 cursor-pointer place-items-center hover:text-accent-ink"
    >
      <SunIcon className="hidden in-data-[theme=dark]:block" />
      <MoonIcon className="hidden in-data-[theme=light]:block" />
    </button>
  );
}
