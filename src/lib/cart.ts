// Pure cart operations. Limits mirror cs_place_order (1–20 per line, ≤ 50 lines).
export const MAX_QTY = 20;
export const MAX_LINES = 50;

export type CartLine = {
  variantId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  /** Display snapshot only; the DB recomputes prices at order time. */
  price: number;
  qty: number;
  /** Stock known when added/re-quoted. */
  maxQty: number;
};

export type VariantQuote = { variantId: string; price: number; stock: number };

const clamp = (qty: number, max: number) => Math.max(0, Math.min(Math.floor(qty), max, MAX_QTY));

export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const existing = lines.find((l) => l.variantId === line.variantId);
  if (existing) {
    return lines.map((l) =>
      l.variantId === line.variantId ? { ...line, qty: clamp(l.qty + line.qty, line.maxQty) } : l,
    );
  }
  if (lines.length >= MAX_LINES) return lines;
  const qty = clamp(line.qty, line.maxQty);
  return qty > 0 ? [...lines, { ...line, qty }] : lines;
}

export function setQty(lines: CartLine[], variantId: string, qty: number): CartLine[] {
  return lines
    .map((l) => (l.variantId === variantId ? { ...l, qty: clamp(qty, l.maxQty) } : l))
    .filter((l) => l.qty > 0);
}

export function removeLine(lines: CartLine[], variantId: string): CartLine[] {
  return lines.filter((l) => l.variantId !== variantId);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.price * l.qty, 0);
}

/** Applies fresh server data: drops unavailable/sold-out lines, updates prices, clamps to stock. */
export function reconcile(lines: CartLine[], quotes: VariantQuote[]) {
  const byId = new Map(quotes.map((q) => [q.variantId, q]));
  const changes = { removed: 0, qtyReduced: 0, priceChanged: 0 };
  const next: CartLine[] = [];

  for (const l of lines) {
    const q = byId.get(l.variantId);
    if (!q || q.stock <= 0) {
      changes.removed++;
      continue;
    }
    const qty = clamp(l.qty, q.stock);
    if (qty < l.qty) changes.qtyReduced++;
    if (q.price !== l.price) changes.priceChanged++;
    next.push({ ...l, qty, price: q.price, maxQty: q.stock });
  }
  return { lines: next, changes };
}
