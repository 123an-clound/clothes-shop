export type ShippingConfig = { flat_fee: number; free_threshold: number };

/** Display-only estimate. Must stay in sync with cs_place_order, which is the source of truth. */
export function calcShippingFee(subtotal: number, cfg: ShippingConfig): number {
  return subtotal >= cfg.free_threshold ? 0 : cfg.flat_fee;
}
