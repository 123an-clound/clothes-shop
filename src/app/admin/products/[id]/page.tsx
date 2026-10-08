import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/ui/form";
import { getAdminProduct, listAdminCategories } from "@/services/admin";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Sửa sản phẩm" };

export default function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  return (
    <>
      <PageHeader title="Sửa sản phẩm" />
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <EditProduct params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EditProduct({ params, searchParams }: Pick<PageProps<"/admin/products/[id]">, "params" | "searchParams">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const [product, categories] = await Promise.all([getAdminProduct(id), listAdminCategories()]);
  if (!product) notFound();
  return (
    <>
      {sp.saved === "1" && (
        <p role="status" className="mb-6 border-l-4 border-accent-ink pl-3">
          Đã lưu sản phẩm.
        </p>
      )}
      {/* key: remount the form with fresh server data after each save/refresh */}
      <ProductForm key={JSON.stringify(product)} product={product} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </>
  );
}
