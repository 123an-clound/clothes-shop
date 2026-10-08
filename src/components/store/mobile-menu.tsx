"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";

type NavItem = { href: string; label: string };

/** Disclosure menu for small screens. Closes on link click and Escape (no pathname read: keeps routes prerenderable). */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Đóng menu" : "Mở menu"}
        onClick={() => setOpen((o) => !o)}
        className="grid size-11 cursor-pointer place-items-center"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      <nav
        id={id}
        aria-label="Danh mục"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b-2 border-fg bg-bg px-4 pb-6"
      >
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center border-b border-line font-display text-2xl font-bold uppercase"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
