"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImageField } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CheckboxField, TextareaField } from "@/components/ui/form";
import { slugify } from "@/lib/slugify";
import type { CategoryInput } from "@/lib/validation/admin";
import { deleteCategory, saveCategory, type ActionResult } from "./actions";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  is_featured: boolean;
  productCount: number;
};

const empty = (sort: number): CategoryInput => ({ name: "", slug: "", description: "", image_url: "", sort_order: sort, is_featured: false });

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryInput | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [result, setResult] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition();

  function edit(c: CategoryRow | null) {
    setResult({});
    setSlugTouched(Boolean(c));
    setEditing(c ? { id: c.id, name: c.name, slug: c.slug, description: c.description, image_url: c.image_url ?? "", sort_order: c.sort_order, is_featured: c.is_featured } : empty(categories.length + 1));
  }

  function save() {
    if (!editing) return;
    startTransition(async () => {
      const r = await saveCategory(editing);
      setResult(r);
      if (r.ok) {
        setEditing(null);
        router.refresh();
      }
    });
  }

  function remove(c: CategoryRow) {
    const note = c.productCount > 0 ? ` ${c.productCount} sản phẩm sẽ không còn thuộc danh mục nào.` : "";
    if (!window.confirm(`Xoá danh mục "${c.name}"?${note}`)) return;
    startTransition(async () => {
      const r = await deleteCategory(c.id);
      setResult(r);
      if (r.ok) router.refresh();
    });
  }

  const err = (k: string) => result.errors?.[k]?.[0];

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_26rem]">
      <div>
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={() => edit(null)}>
            + Thêm danh mục
          </Button>
        </div>
        {result.message && !editing && (
          <p role="status" className={`mb-4 border-l-4 pl-3 text-sm ${result.ok ? "border-accent-ink" : "border-danger text-danger"}`}>
            {result.message}
          </p>
        )}
        <ul className="border-t border-line">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-4 border-b border-line py-3">
              <div className="relative size-14 shrink-0 overflow-hidden bg-surface">
                {c.image_url && <Image src={c.image_url} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {c.name} {c.is_featured && <span className="ml-1 bg-accent px-1 text-[11px] text-on-accent uppercase">Nổi bật</span>}
                </p>
                <p className="truncate text-sm text-muted">
                  /{c.slug} · {c.productCount} sản phẩm · thứ tự {c.sort_order}
                </p>
              </div>
              <button type="button" onClick={() => edit(c)} className="min-h-11 cursor-pointer px-3 text-sm font-bold underline underline-offset-4">
                Sửa
              </button>
              <button type="button" onClick={() => remove(c)} disabled={pending} className="min-h-11 cursor-pointer px-3 text-sm font-bold text-danger underline underline-offset-4">
                Xoá
              </button>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          noValidate
          aria-label={editing.id ? "Sửa danh mục" : "Thêm danh mục"}
          className="flex h-fit flex-col gap-4 border-2 border-fg p-5 xl:sticky xl:top-6"
        >
          <h2 className="text-2xl uppercase">{editing.id ? "Sửa danh mục" : "Danh mục mới"}</h2>
          <Field
            label="Tên"
            value={editing.name}
            error={err("name")}
            onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: slugTouched ? editing.slug : slugify(e.target.value) })}
          />
          <Field
            label="Slug (đường dẫn)"
            value={editing.slug}
            error={err("slug")}
            hint={`/shop/${editing.slug || "…"}`}
            onChange={(e) => {
              setSlugTouched(true);
              setEditing({ ...editing, slug: e.target.value });
            }}
          />
          <TextareaField label="Mô tả" value={editing.description} error={err("description")} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <Field
            label="Thứ tự hiển thị"
            type="number"
            min={0}
            value={editing.sort_order}
            error={err("sort_order")}
            onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
          />
          <CheckboxField label="Nổi bật trên trang chủ" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} />
          <ImageField label="Ảnh bìa" folder="categories" value={editing.image_url} error={err("image_url")} onChange={(url) => setEditing({ ...editing, image_url: url })} />
          {result.message && !result.ok && (
            <p role="alert" className="text-sm text-danger">
              {result.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Đang lưu…" : "Lưu"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
