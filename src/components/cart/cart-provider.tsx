"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useLenis } from "lenis/react";
import { addLine, removeLine, setQty, type CartLine } from "@/lib/cart";
import type { ShippingConfig } from "@/lib/shipping";
import { getServerSnapshot, getSnapshot, subscribe, updateCart } from "./cart-store";
import { CartDrawer } from "./cart-drawer";

type CartContextValue = {
  lines: CartLine[];
  shipping: ShippingConfig;
  add: (line: CartLine) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// Module-level so their identity never changes (safe in effect dependency lists).
const actions = {
  add: (line: CartLine) => updateCart((l) => addLine(l, line)),
  setQty: (id: string, qty: number) => updateCart((l) => setQty(l, id, qty)),
  remove: (id: string) => updateCart((l) => removeLine(l, id)),
  replace: (next: CartLine[]) => updateCart(() => next),
  clear: () => updateCart(() => []),
};

export function useCart() {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({ shipping, children }: { shipping: ShippingConfig; children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);
  const lenis = useLenis();

  const open = useCallback(() => {
    lenis?.stop();
    setIsOpen(true);
  }, [lenis]);
  const close = useCallback(() => {
    lenis?.start();
    setIsOpen(false);
  }, [lenis]);

  const value = useMemo<CartContextValue>(
    () => ({ lines, shipping, ...actions, isOpen, open, close }),
    [lines, shipping, isOpen, open, close],
  );

  return (
    <CartContext value={value}>
      {children}
      <CartDrawer />
    </CartContext>
  );
}
