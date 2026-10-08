"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteImages } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CheckboxField, SelectField, TextareaField } from "@/components/ui/form";
import { slugify } from "@/lib/slugify";
import type { AdminProduct } from "@/services/admin";
import { deleteProduct, saveProduct, type SaveProductResult } from "./actions";
import { GalleryEditor, type GalleryImage } from "./gallery-editor";
import { VariantEditor, type VariantRow } from "./variant-editor";

type Props = { product: AdminProduct | null; categories: { id: string; name: string }[] };

const key = () => crypto.randomUUID();

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveProductResult>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);

  const [info, setInfo] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
    price: product?.price ?? 0,
    compare_at_price: product?.compare_at_price ?? null,
    is_published: product?.is_published ?? false,
    is_featured: product?.is_featured ?? false,
  });
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.cs_variants ?? []).map((v) => ({ ...v, key: key() })),
  );
  const [images, setImages] = useState<GalleryImage[]>(
    [...(product?.cs_product_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({ key: key(), url: i.url, alt: i.alt, color: i.color ?? "" })),
  );

  const errors = result.errors ?? {};
  const err = (k: string) => errors[k]?.[0];
  const colors = [...new Set(variants.map((v) => v.color.trim()).filter(Boolean))];

  function save() {
    const payload = {
      id: product?.id ?? "",
      ...info,
      variants: variants.map((v) => ({ id: v.id, size: v.size, color: v.color, color_hex: v.color_hex, sku: v.sku, price: v.price, stock: v.stock })),
      images: images.map((i) => ({ url: i.url, alt: i.alt, color: i.color })),
    };
    startTransition(async () => {
      const r = await saveProduct(payload);
      setResult(r);
      if (!r.ok) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // Gallery is committed: now safe to delete files the admin removed.
      if (removedUrls.length) await deleteImages(removedUrls);
      setRemovedUrls([]);
      // Reload server data (new variant ids!) into a fresh form; the banner comes from ?saved=1.
      router.replace(`/admin/products/${r.id}?saved=1`);
      router.refresh();
    });
  }

  function remove() {
    if (!product || !window.confirm(`Xoá vĩnh viễn "${product.name}"? Đơn hàng cũ vẫn giữ thông tin sản phẩm.`)) return;
    startTransition(async () => {
      const r = await deleteProduct(product.id);
      if (!r.ok) return setResult(r);
      if (r.imageUrls?.length) await deleteImages(r.imageUrls);
      router.replace("/admin/products");
    });
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-10"
    >
      {result.message && (
        <p role={result.ok ? "status" : "alert"} className={`border-l-4 pl-3 ${result.ok ? "border-accent-ink" : "border-danger text-danger"}`}>
          {result.message}
        </p>
      )}

      <section aria-labelledby="info-h" className="grid gap-5 lg:grid-cols-2">
        <h2 id="info-h" className="text-2xl uppercase lg:col-span-2">
          Thông tin
        </h2>
        <Field
          label="Tên sản phẩm"
          value={info.name}
          error={err("name")}
          onChange={(e) => setInfo({ ...info, name: e.target.value, slug: slugTouched ? info.slug : slugify(e.target.value) })}
        />
        <Field
          label="Slug (đường dẫn)"
          value={info.slug}
          error={err("slug")}
          hint={`/products/${info.slug || "…"}`}
          onChange={(e) => {
            setSlugTouched(true);
            setInfo({ ...info, slug: e.target.value });
          }}
        />
        <SelectField label="Danh mục" value={info.category_id} error={err("category_id")} onChange={(e) => setInfo({ ...info, category_id: e.target.value })}>
          <option value="">— Không có —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Giá bán (đ)" type="number" min={0} value={info.price} error={err("price")} onChange={(e) => setInfo({ ...info, price: Number(e.target.value) })} />
          <Field
            label="Giá gốc (đ)"
            type="number"
            min={0}
            hint="Để trống nếu không giảm giá"
            value={info.compare_at_price ?? ""}
            error={err("compare_at_price")}
            onChange={(e) => setInfo({ ...info, compare_at_price: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>
        <TextareaField label="Mô tả" className="lg:col-span-2" rows={6} value={info.description} error={err("description")} onChange={(e) => setInfo({ ...info, description: e.target.value })} />
        <div className="flex flex-wrap gap-6 lg:col-span-2">
          <CheckboxField label="Hiển thị trên shop" hint="Bỏ chọn để ẩn sản phẩm" checked={info.is_published} onChange={(e) => setInfo({ ...info, is_published: e.target.checked })} />
          <CheckboxField label="Sản phẩm nổi bật" checked={info.is_featured} onChange={(e) => setInfo({ ...info, is_featured: e.target.checked })} />
        </div>
      </section>

      <section aria-labelledby="var-h" className="flex flex-col gap-4">
        <h2 id="var-h" className="text-2xl uppercase">
          Biến thể & tồn kho
        </h2>
        <VariantEditor rows={variants} onChange={setVariants} slug={info.slug} errors={errors} />
      </section>

      <section aria-labelledby="img-h" className="flex flex-col gap-4">
        <h2 id="img-h" className="text-2xl uppercase">
          Ảnh sản phẩm
        </h2>
        <GalleryEditor images={images} onChange={setImages} colors={colors} onRemove={(url) => setRemovedUrls((u) => [...u, url])} />
        {Object.entries(errors)
          .filter(([k]) => k.startsWith("images"))
          .map(([k, v]) => (
            <p key={k} role="alert" className="text-sm text-danger">
              {v?.[0]}
            </p>
          ))}
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-fg bg-bg px-4 py-3 sm:-mx-8 sm:px-8">
        <Button type="submit" disabled={pending} className="min-w-40">
          {pending ? "Đang lưu…" : "Lưu sản phẩm"}
        </Button>
        <Link href="/admin/products" className="min-h-11 content-center px-3 text-sm font-bold underline underline-offset-4">
          Quay lại
        </Link>
        {product && (
          <>
            <Link href={`/products/${product.slug}`} target="_blank" className="min-h-11 content-center px-3 text-sm font-bold underline underline-offset-4">
              Xem trên shop ↗
            </Link>
            <button type="button" onClick={remove} disabled={pending} className="ml-auto min-h-11 cursor-pointer px-3 text-sm font-bold text-danger underline underline-offset-4">
              Xoá sản phẩm
            </button>
          </>
        )}
      </div>
    </form>
  );
}
