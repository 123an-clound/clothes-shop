import { z } from "zod";
import type { CartLine } from "@/lib/cart";

// localStorage-backed external store for useSyncExternalStore. Syncs across tabs via the storage event.
const KEY = "cs-cart-v1";
const EMPTY: CartLine[] = [];

// localStorage is user-controlled: validate shape before trusting it for rendering.
const lineSchema = z.object({
  variantId: z.uuid(),
  slug: z.string().max(200),
  name: z.string().max(200),
  image: z.string().max(2000),
  size: z.string().max(20),
  color: z.string().max(50),
  price: z.number().int().min(0),
  qty: z.number().int().min(1).max(20),
  maxQty: z.number().int().min(0),
});
const linesSchema = z.array(lineSchema).max(50).catch([]);

const listeners = new Set<() => void>();
let raw: string | null | undefined;
let cache: CartLine[] = EMPTY;

function read(): CartLine[] {
  let current: string | null = null;
  try {
    current = localStorage.getItem(KEY);
  } catch {
    return cache;
  }
  if (current !== raw) {
    raw = current;
    try {
      cache = current ? linesSchema.parse(JSON.parse(current)) : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

export function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export const getSnapshot = read;
export const getServerSnapshot = () => EMPTY;

export function updateCart(fn: (lines: CartLine[]) => CartLine[]) {
  const next = fn(read());
  cache = next;
  raw = JSON.stringify(next);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // Storage full/blocked: cart still works for this page view.
  }
  listeners.forEach((l) => l());
}
