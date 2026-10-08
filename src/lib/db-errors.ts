const UNIQUE: [string, string][] = [
  ["cs_products_slug_key", "Slug sản phẩm đã tồn tại, hãy chọn slug khác."],
  ["cs_categories_slug_key", "Slug danh mục đã tồn tại, hãy chọn slug khác."],
  ["cs_variants_sku_key", "SKU đã được dùng cho một biến thể khác."],
  ["cs_variants_product_id_size_color_key", "Mỗi cặp size + màu chỉ được xuất hiện một lần."],
];

/** Postgres/PostgREST error -> Vietnamese message. Never echoes raw database text. */
export function dbErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "Có lỗi xảy ra. Vui lòng thử lại.";
  if (error.message === "FORBIDDEN") return "Bạn không có quyền thực hiện thao tác này.";
  if (error.message === "NOT_FOUND") return "Dữ liệu không còn tồn tại. Vui lòng tải lại trang.";
  if (error.code === "23505") {
    return UNIQUE.find(([name]) => error.message?.includes(name))?.[1] ?? "Dữ liệu bị trùng.";
  }
  if (error.code === "23514" || error.code === "22P02") return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  return "Không lưu được. Vui lòng thử lại.";
}
