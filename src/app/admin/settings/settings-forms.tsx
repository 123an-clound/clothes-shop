"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ImageField } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField, TextareaField } from "@/components/ui/form";
import { formatVnd } from "@/lib/money";
import type { Settings, SettingsKey } from "@/lib/validation/settings";
import { saveSettings, type SettingsResult } from "./actions";

// VietQR-supported banks; BINs verified against https://api.vietqr.io/v2/banks (2026-10-08).
const BANKS: [string, string][] = [
  ["970436", "Vietcombank"], ["970415", "VietinBank"], ["970418", "BIDV"], ["970405", "Agribank"],
  ["970407", "Techcombank"], ["970422", "MBBank"], ["970416", "ACB"], ["970432", "VPBank"],
  ["970423", "TPBank"], ["970403", "Sacombank"], ["970437", "HDBank"], ["970441", "VIB"],
  ["970443", "SHB"], ["970431", "Eximbank"], ["970426", "MSB"], ["970448", "OCB"],
  ["970440", "SeABank"], ["970449", "LPBank"], ["970428", "Nam A Bank"], ["970409", "Bac A Bank"],
  ["970412", "PVcomBank"], ["970452", "KienLongBank"], ["970454", "Viet Capital Bank"], ["970429", "SCB"],
  ["546034", "CAKE by VPBank"], ["963388", "Timo"],
];

function useSection<K extends SettingsKey>(key: K, initial: Settings[K]) {
  const [value, setValue] = useState(initial);
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, startTransition] = useTransition();
  const save = () => startTransition(async () => setResult(await saveSettings(key, value)));
  const err = (field: string) => result?.errors?.[field]?.[0];
  return { value, setValue, result, pending, save, err };
}

function Section({ title, id, children, result, pending, onSave }: { title: string; id: string; children: React.ReactNode; result: SettingsResult | null; pending: boolean; onSave: () => void }) {
  return (
    <section aria-labelledby={id} className="border-2 border-line p-5">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="flex flex-col gap-4"
      >
        <h2 id={id} className="text-2xl uppercase">
          {title}
        </h2>
        {children}
        {result && (
          <p role={result.ok ? "status" : "alert"} className={`text-sm ${result.ok ? "" : "text-danger"}`}>
            {result.message}
          </p>
        )}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Đang lưu…" : "Lưu"}
        </Button>
      </form>
    </section>
  );
}

export function StoreForm({ initial }: { initial: Settings["store"] }) {
  const s = useSection("store", initial);
  const set = (patch: Partial<Settings["store"]>) => s.setValue({ ...s.value, ...patch });
  return (
    <Section title="Thông tin shop" id="store-h" result={s.result} pending={s.pending} onSave={s.save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên shop" value={s.value.name} error={s.err("name")} onChange={(e) => set({ name: e.target.value })} />
        <Field label="Khẩu hiệu" value={s.value.tagline} error={s.err("tagline")} onChange={(e) => set({ tagline: e.target.value })} />
        <Field label="Email liên hệ" type="email" value={s.value.email} error={s.err("email")} onChange={(e) => set({ email: e.target.value })} />
        <Field label="Số điện thoại" type="tel" value={s.value.phone} error={s.err("phone")} onChange={(e) => set({ phone: e.target.value })} />
        <Field label="Địa chỉ" className="sm:col-span-2" value={s.value.address} error={s.err("address")} onChange={(e) => set({ address: e.target.value })} />
        <Field label="Facebook (URL)" type="url" placeholder="https://facebook.com/…" value={s.value.facebook} error={s.err("facebook")} onChange={(e) => set({ facebook: e.target.value })} />
        <Field label="Instagram (URL)" type="url" placeholder="https://instagram.com/…" value={s.value.instagram} error={s.err("instagram")} onChange={(e) => set({ instagram: e.target.value })} />
        <Field label="TikTok (URL)" type="url" placeholder="https://tiktok.com/@…" value={s.value.tiktok} error={s.err("tiktok")} onChange={(e) => set({ tiktok: e.target.value })} />
      </div>
    </Section>
  );
}

export function SeoForm({ initial }: { initial: Settings["seo"] }) {
  const s = useSection("seo", initial);
  const set = (patch: Partial<Settings["seo"]>) => s.setValue({ ...s.value, ...patch });
  return (
    <Section title="SEO trang chủ" id="seo-h" result={s.result} pending={s.pending} onSave={s.save}>
      <Field label="Tiêu đề (title)" hint={`${s.value.title.length}/70 ký tự`} value={s.value.title} error={s.err("title")} onChange={(e) => set({ title: e.target.value })} />
      <TextareaField label="Mô tả (meta description)" hint={`${s.value.description.length}/160 ký tự`} value={s.value.description} error={s.err("description")} onChange={(e) => set({ description: e.target.value })} />
      <ImageField label="Ảnh chia sẻ mạng xã hội (1200×630)" folder="site" aspect="aspect-[1200/630]" value={s.value.og_image} error={s.err("og_image")} onChange={(og_image) => set({ og_image })} />
      <div className="border-2 border-dashed border-line p-3 text-sm" aria-label="Xem trước kết quả tìm kiếm">
        <p className="text-xs text-muted">Xem trước trên Google</p>
        <p className="text-lg text-accent-ink">{s.value.title || "Tiêu đề"}</p>
        <p className="text-muted">{s.value.description || "Mô tả"}</p>
      </div>
    </Section>
  );
}

export function ShippingForm({ initial }: { initial: Settings["shipping"] }) {
  const s = useSection("shipping", initial);
  return (
    <Section title="Phí giao hàng" id="ship-h" result={s.result} pending={s.pending} onSave={s.save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phí đồng giá (đ)" type="number" min={0} value={s.value.flat_fee} error={s.err("flat_fee")} onChange={(e) => s.setValue({ ...s.value, flat_fee: Number(e.target.value) })} />
        <Field label="Miễn phí từ (đ)" type="number" min={0} value={s.value.free_threshold} error={s.err("free_threshold")} onChange={(e) => s.setValue({ ...s.value, free_threshold: Number(e.target.value) })} />
      </div>
      <p className="text-sm text-muted">
        Đơn dưới {formatVnd(s.value.free_threshold || 0)} tính phí {formatVnd(s.value.flat_fee || 0)}. Áp dụng ngay cho đơn mới.
      </p>
    </Section>
  );
}

export function BankForm({ initial }: { initial: Settings["bank"] }) {
  const s = useSection("bank", initial);
  const set = (patch: Partial<Settings["bank"]>) => s.setValue({ ...s.value, ...patch });
  const ready = /^\d{6}$/.test(s.value.bank_bin) && /^\d{4,20}$/.test(s.value.account_number);
  const preview = `https://img.vietqr.io/image/${s.value.bank_bin}-${s.value.account_number}-compact2.png?amount=100000&addInfo=CSTEST&accountName=${encodeURIComponent(s.value.account_name)}`;
  return (
    <Section title="Tài khoản nhận chuyển khoản (VietQR)" id="bank-h" result={s.result} pending={s.pending} onSave={s.save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Ngân hàng" value={s.value.bank_bin} error={s.err("bank_bin")} onChange={(e) => set({ bank_bin: e.target.value })}>
          <option value="">— Chưa chọn (tắt mã QR) —</option>
          {BANKS.map(([bin, name]) => (
            <option key={bin} value={bin}>
              {name}
            </option>
          ))}
        </SelectField>
        <Field label="Số tài khoản" inputMode="numeric" value={s.value.account_number} error={s.err("account_number")} onChange={(e) => set({ account_number: e.target.value.replace(/\D/g, "") })} />
        <Field label="Tên chủ tài khoản" className="sm:col-span-2" hint="Viết hoa không dấu, đúng như trên ngân hàng" value={s.value.account_name} error={s.err("account_name")} onChange={(e) => set({ account_name: e.target.value.toUpperCase() })} />
      </div>
      {ready && (
        <div className="flex items-center gap-4">
          <Image src={preview} alt="Mã QR mẫu 100.000đ để kiểm tra thông tin tài khoản" width={160} height={160} unoptimized className="bg-white" />
          <p className="text-sm text-muted">Quét thử bằng app ngân hàng để chắc chắn đúng tài khoản trước khi lưu (không cần chuyển tiền).</p>
        </div>
      )}
    </Section>
  );
}

export function FaqForm({ initial }: { initial: Settings["faq"] }) {
  const s = useSection("faq", initial);
  const update = (i: number, patch: Partial<Settings["faq"][number]>) => s.setValue(s.value.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...s.value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    s.setValue(next);
  };
  return (
    <Section title="Câu hỏi thường gặp (FAQ)" id="faq-h" result={s.result} pending={s.pending} onSave={s.save}>
      <p className="text-sm text-muted">Hiển thị tại /faq (kèm dữ liệu cấu trúc cho Google). Trang chưa được index cho tới khi có câu hỏi.</p>
      <ol className="flex flex-col gap-4">
        {s.value.map((f, i) => (
          <li key={i} className="flex flex-col gap-3 border-2 border-line p-3">
            <Field label={`Câu hỏi ${i + 1}`} value={f.q} error={s.err(`${i}.q`)} onChange={(e) => update(i, { q: e.target.value })} />
            <TextareaField label="Trả lời" rows={3} value={f.a} error={s.err(`${i}.a`)} onChange={(e) => update(i, { a: e.target.value })} />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Đưa câu hỏi ${i + 1} lên`}>
                ↑
              </Button>
              <Button type="button" variant="ghost" disabled={i === s.value.length - 1} onClick={() => move(i, 1)} aria-label={`Đưa câu hỏi ${i + 1} xuống`}>
                ↓
              </Button>
              <Button type="button" variant="ghost" className="ml-auto text-danger" onClick={() => s.setValue(s.value.filter((_, j) => j !== i))}>
                Xoá
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <Button type="button" variant="outline" className="self-start" disabled={s.value.length >= 30} onClick={() => s.setValue([...s.value, { q: "", a: "" }])}>
        + Thêm câu hỏi
      </Button>
    </Section>
  );
}

export function PoliciesForm({ initial }: { initial: Settings["policies"] }) {
  const s = useSection("policies", initial);
  const set = (patch: Partial<Settings["policies"]>) => s.setValue({ ...s.value, ...patch });
  return (
    <Section title="Chính sách" id="pol-h" result={s.result} pending={s.pending} onSave={s.save}>
      <TextareaField label="Giao hàng" rows={4} value={s.value.shipping} error={s.err("shipping")} onChange={(e) => set({ shipping: e.target.value })} />
      <TextareaField label="Đổi trả" rows={4} value={s.value.returns} error={s.err("returns")} onChange={(e) => set({ returns: e.target.value })} />
      <TextareaField label="Bảo mật" rows={4} value={s.value.privacy} error={s.err("privacy")} onChange={(e) => set({ privacy: e.target.value })} />
    </Section>
  );
}
