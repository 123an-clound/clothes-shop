import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "./orders";
import { requireAdmin } from "./auth";

// Every function re-checks admin rights; RLS / security definer checks enforce the same rule in the DB.

export type AdminStats = {
  revenue_total: number;
  revenue_30d: number;
  orders_30d: number;
  unpaid_transfers: number;
  by_status: Partial<Record<OrderStatus, number>>;
  daily: { day: string; revenue: number; orders: number }[];
  low_stock: { product_id: string; name: string; size: string; color: string; stock: number }[];
  recent: {
    id: string;
    code: string;
    recipient_name: string;
    total: number;
    status: OrderStatus;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    created_at: string;
  }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cs_admin_stats");
  if (error) throw new Error(`stats: ${error.message}`);
  return data as unknown as AdminStats;
}

export const ADMIN_PAGE_SIZE = 20;

export async function listAdminProducts(opts: { q?: string; status?: "published" | "hidden"; page: number }) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("cs_products")
    .select("id, slug, name, price, is_published, is_featured, updated_at, cs_categories(name), cs_product_images(url, sort_order), cs_variants(stock)", { count: "exact" })
    .order("updated_at", { ascending: false });
  if (opts.q) query = query.ilike("name", `%${opts.q.replace(/[%_\\]/g, "\\$&")}%`);
  if (opts.status) query = query.eq("is_published", opts.status === "published");
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error?.code === "PGRST103") return { items: [], total: count ?? 0 };
  if (error) throw new Error(`admin products: ${error.message}`);
  return {
    total: count ?? 0,
    items: data.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      isPublished: p.is_published,
      isFeatured: p.is_featured,
      category: p.cs_categories?.name ?? null,
      image: [...p.cs_product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
      stock: p.cs_variants.reduce((n, v) => n + v.stock, 0),
      variantCount: p.cs_variants.length,
    })),
  };
}

export async function getAdminProduct(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cs_products")
    .select(
      "id, slug, name, description, category_id, price, compare_at_price, is_published, is_featured, " +
        "cs_variants(id, size, color, color_hex, sku, price, stock), cs_product_images(url, alt, color, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`admin product: ${error.message}`);
  return data as unknown as AdminProduct | null;
}

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  is_published: boolean;
  is_featured: boolean;
  cs_variants: { id: string; size: string; color: string; color_hex: string; sku: string; price: number | null; stock: number }[];
  cs_product_images: { url: string; alt: string; color: string | null; sort_order: number }[];
};

export async function listAdminCategories() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cs_categories")
    .select("id, slug, name, description, image_url, sort_order, is_featured, cs_products(count)")
    .order("sort_order");
  if (error) throw new Error(`admin categories: ${error.message}`);
  return data.map((c) => ({ ...c, productCount: (c.cs_products as unknown as { count: number }[])[0]?.count ?? 0 }));
}

export async function listAdminOrders(opts: { status?: OrderStatus; q?: string; page: number }) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("cs_orders")
    .select("id, code, recipient_name, phone, total, status, payment_method, payment_status, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.q) {
    const q = opts.q.replace(/[^\w]/g, "");
    if (q) query = query.or(`code.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  const from = (opts.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error?.code === "PGRST103") return { items: [], total: count ?? 0 };
  if (error) throw new Error(`admin orders: ${error.message}`);
  return { items: data, total: count ?? 0 };
}

export async function getAdminOrder(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cs_orders")
    .select(
      "id, code, user_id, status, payment_method, payment_status, recipient_name, phone, address_line, ward, district, province, note, " +
        "subtotal, shipping_fee, total, created_at, updated_at, cs_order_items(id, product_name, size, color, unit_price, quantity)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`admin order: ${error.message}`);
  return data as unknown as import("./orders").OrderDetail & { user_id: string | null; updated_at: string } | null;
}
