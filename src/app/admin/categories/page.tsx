import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/form";
import { listAdminCategories } from "@/services/admin";
import { CategoryManager } from "./category-manager";

export const metadata: Metadata = { title: "Danh mục" };

export default function AdminCategoriesPage() {
  return (
    <>
      <PageHeader title="Danh mục" />
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  return <CategoryManager categories={await listAdminCategories()} />;
}
