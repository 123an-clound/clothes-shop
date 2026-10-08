import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/form";
import { formatVnd } from "@/lib/money";
import { ADMIN_PAGE_SIZE, listAdminProducts } from "@/services/admin";
import { PublishToggle } from "./publish-toggle";

export const metadata: Metadata = { title: "Sản phẩm" };

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader title="Sản phẩm">
        <Link href="/admin/products/new" className={buttonClass("primary")}>
          + Thêm sản phẩm
        </Link>
      </PageHeader>
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function ProductList({ searchParams }: { searchParams: PageProps<"/admin/products">["searchParams"] }) {
  const sp = await searchParams;
  const q = (first(sp.q) ?? "").trim().slice(0, 100);
  const statusRaw = first(sp.status);
  const status = statusRaw === "published" || statusRaw === "hidden" ? statusRaw : undefined;
  const page = Math.max(1, Math.min(1000, Number(first(sp.page)) || 1));
  const { items, total } = await listAdminProducts({ q, status, page });
  const pages = Math.ceil(total / ADMIN_PAGE_SIZE);
  const href = (p: Record<string, string | number | undefined>) => {
    const s = new URLSearchParams();
    const merged = { q, status, page: 1, ...p };
    Object.entries(merged).forEach(([k, v]) => v !== undefined && v !== "" && !(k === "page" && v === 1) && s.set(k, String(v)));
    const qs = s.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };
  const tabs = [
    { label: "Tất cả", value: undefined },
    { label: "Đang hiện", value: "published" },
    { label: "Đang ẩn", value: "hidden" },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <form action="/admin/products" className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <label className="sr-only" htmlFor="q">
            Tìm sản phẩm
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Tìm theo tên…" className="min-h-11 w-64 border-2 border-line bg-surface px-3 text-fg focus:border-accent-ink focus:outline-none" />
          <button className="min-h-11 cursor-pointer border-2 border-fg px-4 text-sm font-bold uppercase">Tìm</button>
        </form>
        <nav aria-label="Lọc trạng thái" className="flex gap-1">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={href({ status: t.value })}
              aria-current={status === t.value ? "page" : undefined}
              className="min-h-11 content-center border-2 border-line px-3 text-sm font-bold aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg"
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <p className="ml-auto text-sm text-muted">{total} sản phẩm</p>
      </div>

      {items.length === 0 ? (
        <p className="border-2 border-dashed border-line p-8 text-center text-muted">Không có sản phẩm phù hợp.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-fg text-xs text-muted uppercase">
                <th className="py-2">Sản phẩm</th>
                <th className="py-2">Danh mục</th>
                <th className="py-2 text-right">Giá</th>
                <th className="py-2 text-right">Tồn kho</th>
                <th className="py-2 text-center">Hiển thị</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-line">
                  <td className="py-2">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-bold hover:underline">
                      <span className="relative size-12 shrink-0 overflow-hidden bg-surface">
                        {p.image && <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span>
                        {p.name}
                        {p.isFeatured && <span className="ml-2 bg-accent px-1 text-[11px] text-on-accent uppercase">Nổi bật</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 text-muted">{p.category ?? "—"}</td>
                  <td className="py-2 text-right">{formatVnd(p.price)}</td>
                  <td className={`py-2 text-right ${p.stock === 0 ? "font-bold text-danger" : ""}`}>
                    {p.stock} <span className="text-xs text-muted">({p.variantCount} biến thể)</span>
                  </td>
                  <td className="py-2 text-center">
                    <PublishToggle id={p.id} name={p.name} published={p.isPublished} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Phân trang" className="flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: n })}
              aria-current={n === page ? "page" : undefined}
              className="grid size-11 place-items-center border-2 border-line font-bold aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg"
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
