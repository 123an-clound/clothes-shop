import type { Metadata } from "next";
import { Suspense } from "react";
import { FreshOnNavigate } from "@/components/fresh-on-navigate";
import { PageHeader } from "@/components/ui/form";
import { listAdminCategories } from "@/services/admin";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Thêm sản phẩm" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Thêm sản phẩm" />
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  const categories = await listAdminCategories();
  return (
    <FreshOnNavigate>
      <ProductForm product={null} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </FreshOnNavigate>
  );
}
