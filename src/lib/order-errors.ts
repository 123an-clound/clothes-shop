const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  INVALID_INPUT: "Thông tin đơn hàng không hợp lệ. Vui lòng kiểm tra lại.",
  RATE_LIMITED: "Bạn đặt hàng quá nhanh. Vui lòng thử lại sau ít phút.",
  NOT_FOUND: "Một sản phẩm trong giỏ không còn bán. Giỏ hàng đã được cập nhật.",
  OUT_OF_STOCK: "Một sản phẩm trong giỏ vừa hết hàng hoặc không đủ số lượng. Giỏ hàng đã được cập nhật.",
};

/** DB error code -> Vietnamese message. Unknown errors never leak raw database text. */
export function orderErrorMessage(code: string): string {
  return MESSAGES[code] ?? "Không thể đặt hàng lúc này. Vui lòng thử lại.";
}
