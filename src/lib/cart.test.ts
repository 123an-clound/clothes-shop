import { describe, expect, it } from "vitest";
import { addLine, cartCount, cartSubtotal, reconcile, removeLine, setQty, type CartLine } from "@/lib/cart";
import { checkoutSchema } from "@/lib/validation/checkout";
import { orderErrorMessage } from "@/lib/order-errors";

const line = (over: Partial<CartLine> = {}): CartLine => ({
  variantId: "v1",
  slug: "tee",
  name: "Tee",
  image: "",
  size: "M",
  color: "Đen",
  price: 100000,
  qty: 1,
  maxQty: 5,
  ...over,
});

describe("cart lines", () => {
  it("adds new lines and merges same variant, capped by stock and 20", () => {
    let lines = addLine([], line({ qty: 2 }));
    lines = addLine(lines, line({ qty: 2 }));
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(4);
    lines = addLine(lines, line({ qty: 9 }));
    expect(lines[0].qty).toBe(5);
    expect(addLine([], line({ qty: 30, maxQty: 100 }))[0].qty).toBe(20);
  });

  it("setQty clamps and removes at 0", () => {
    const lines = [line({ qty: 2 })];
    expect(setQty(lines, "v1", 99)[0].qty).toBe(5);
    expect(setQty(lines, "v1", 0)).toEqual([]);
    expect(removeLine(lines, "v1")).toEqual([]);
  });

  it("caps the number of lines at 50", () => {
    let lines: CartLine[] = [];
    for (let i = 0; i < 60; i++) lines = addLine(lines, line({ variantId: `v${i}` }));
    expect(lines).toHaveLength(50);
  });

  it("counts and sums", () => {
    const lines = [line({ qty: 2 }), line({ variantId: "v2", price: 50000, qty: 3 })];
    expect(cartCount(lines)).toBe(5);
    expect(cartSubtotal(lines)).toBe(350000);
  });
});

describe("reconcile with fresh server quotes", () => {
  it("drops unavailable lines, updates price, clamps to stock and reports changes", () => {
    const lines = [line({ qty: 4 }), line({ variantId: "gone" }), line({ variantId: "v3", price: 1 })];
    const { lines: next, changes } = reconcile(lines, [
      { variantId: "v1", price: 100000, stock: 2 },
      { variantId: "v3", price: 200000, stock: 10 },
    ]);
    expect(next.map((l) => [l.variantId, l.qty, l.price, l.maxQty])).toEqual([
      ["v1", 2, 100000, 2],
      ["v3", 1, 200000, 10],
    ]);
    expect(changes).toEqual({ removed: 1, qtyReduced: 1, priceChanged: 1 });
  });

  it("removes sold-out lines", () => {
    expect(reconcile([line()], [{ variantId: "v1", price: 100000, stock: 0 }]).lines).toEqual([]);
  });
});

describe("checkoutSchema", () => {
  const valid = {
    recipient_name: "Nguyễn Văn A",
    phone: "0912345678",
    address_line: "12 Lê Lợi",
    ward: "Bến Nghé",
    district: "Quận 1",
    province: "TP. Hồ Chí Minh",
    note: "",
    payment_method: "cod",
  };
  it("accepts a valid address", () => expect(checkoutSchema.safeParse(valid).success).toBe(true));
  it("rejects bad phone, short address and unknown payment", () => {
    for (const bad of [{ phone: "123" }, { address_line: "x" }, { payment_method: "card" }, { recipient_name: "" }]) {
      expect(checkoutSchema.safeParse({ ...valid, ...bad }).success).toBe(false);
    }
  });
  it("normalises phone with spaces and +84", () => {
    expect(checkoutSchema.parse({ ...valid, phone: "+84 912 345 678" }).phone).toBe("0912345678");
  });
});

describe("orderErrorMessage", () => {
  it("maps known DB codes and hides unknown ones", () => {
    expect(orderErrorMessage("OUT_OF_STOCK")).toMatch(/hết hàng/i);
    expect(orderErrorMessage("RATE_LIMITED")).toMatch(/thử lại/i);
    expect(orderErrorMessage('duplicate key value violates "x"')).not.toMatch(/duplicate/);
  });
});
