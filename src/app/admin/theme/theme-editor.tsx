"use client";

import { useState, useTransition } from "react";
import { ImageField } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/form";
import { contrastRatio } from "@/lib/color";
import { FONT_OPTIONS, RADIUS_OPTIONS, type Settings } from "@/lib/validation/settings";
import { saveSettings, type SettingsResult } from "../settings/actions";

type Theme = Settings["theme"];

const FONT_LABEL: Record<(typeof FONT_OPTIONS)[number], string> = {
  "space-grotesk": "Space Grotesk",
  inter: "Inter",
  "be-vietnam-pro": "Be Vietnam Pro",
};
const FONT_VAR: Record<(typeof FONT_OPTIONS)[number], string> = {
  "space-grotesk": "var(--font-space-grotesk)",
  inter: "var(--font-inter)",
  "be-vietnam-pro": "var(--font-be-vietnam-pro)",
};
const RADIUS_LABEL = { none: "Vuông (0px)", sm: "Bo nhẹ (4px)", md: "Bo vừa (10px)" } as const;
const RADIUS_PX = { none: "0px", sm: "4px", md: "10px" } as const;
const ON_ACCENT = "#0a0a0a";

const PRESETS: { name: string; theme: Pick<Theme, "accent" | "background" | "foreground"> }[] = [
  { name: "Neon Lime", theme: { accent: "#c6ff00", background: "#0a0a0a", foreground: "#f5f5f0" } },
  { name: "Safety Orange", theme: { accent: "#ff6b1a", background: "#0d0d0d", foreground: "#f2efe9" } },
  { name: "Electric Blue", theme: { accent: "#3d9bff", background: "#07090f", foreground: "#eef2f8" } },
  { name: "Hot Pink", theme: { accent: "#ff4fa3", background: "#0b0a0c", foreground: "#f7f1f4" } },
];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-bold tracking-wider uppercase">
      {label}
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-14 cursor-pointer border-2 border-line bg-surface" aria-label={`${label} (bảng màu)`} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          aria-label={`${label} (mã hex)`}
          className="min-h-11 w-28 border-2 border-line bg-surface px-2 font-mono text-sm text-fg normal-case focus:border-accent-ink focus:outline-none"
        />
      </span>
    </label>
  );
}

export function ThemeEditor({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, startTransition] = useTransition();
  const valid = (h: string) => /^#[0-9a-fA-F]{6}$/.test(h);
  const textContrast = valid(theme.foreground) && valid(theme.background) ? contrastRatio(theme.foreground, theme.background) : 0;
  const buttonContrast = valid(theme.accent) ? contrastRatio(ON_ACCENT, theme.accent) : 0;

  const previewVars = {
    "--bg": theme.background,
    "--fg": theme.foreground,
    "--accent": theme.accent,
    "--accent-ink": theme.accent,
    // Derived tokens are computed where declared (:root), so recompute them for the preview scope.
    "--surface": "color-mix(in oklab, var(--fg) 6%, var(--bg))",
    "--line": "color-mix(in oklab, var(--fg) 18%, var(--bg))",
    "--muted": "color-mix(in oklab, var(--fg) 68%, var(--bg))",
    "--radius": RADIUS_PX[theme.radius],
    "--font-heading": FONT_VAR[theme.font_display],
    "--font-body": FONT_VAR[theme.font_body],
  } as React.CSSProperties;

  function save() {
    startTransition(async () => setResult(await saveSettings("theme", theme)));
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[24rem_1fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-6"
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-xs font-bold tracking-widest uppercase">Bộ màu có sẵn</legend>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setTheme({ ...theme, ...p.theme })}
                className="flex min-h-11 cursor-pointer items-center gap-2 border-2 border-line px-2 text-sm font-bold hover:border-fg"
              >
                <span className="size-5 border border-line" style={{ background: p.theme.accent }} aria-hidden="true" />
                {p.name}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <ColorInput label="Màu nhấn" value={theme.accent} onChange={(accent) => setTheme({ ...theme, accent })} />
          <ColorInput label="Nền (chế độ tối)" value={theme.background} onChange={(background) => setTheme({ ...theme, background })} />
          <ColorInput label="Chữ (chế độ tối)" value={theme.foreground} onChange={(foreground) => setTheme({ ...theme, foreground })} />
        </div>

        <ul className="flex flex-col gap-1 text-sm" aria-live="polite">
          <li className={textContrast >= 4.5 ? "" : "font-bold text-danger"}>
            Chữ / nền: {textContrast.toFixed(1)}:1 {textContrast >= 4.5 ? "✓ đạt WCAG AA" : "✗ cần ≥ 4.5:1"}
          </li>
          <li className={buttonContrast >= 4.5 ? "" : "font-bold text-danger"}>
            Chữ trên nút màu nhấn: {buttonContrast.toFixed(1)}:1 {buttonContrast >= 4.5 ? "✓ đạt WCAG AA" : "✗ màu nhấn quá tối"}
          </li>
        </ul>

        <SelectField label="Font tiêu đề" value={theme.font_display} onChange={(e) => setTheme({ ...theme, font_display: e.target.value as Theme["font_display"] })}>
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {FONT_LABEL[f]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Font nội dung" value={theme.font_body} onChange={(e) => setTheme({ ...theme, font_body: e.target.value as Theme["font_body"] })}>
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {FONT_LABEL[f]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Bo góc" value={theme.radius} onChange={(e) => setTheme({ ...theme, radius: e.target.value as Theme["radius"] })}>
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {RADIUS_LABEL[r]}
            </option>
          ))}
        </SelectField>
        <ImageField label="Logo (để trống = dùng tên shop)" folder="site" aspect="aspect-[4/1]" value={theme.logo_url} onChange={(logo_url) => setTheme({ ...theme, logo_url })} />

        {result && (
          <p role={result.ok ? "status" : "alert"} className={`text-sm ${result.ok ? "" : "text-danger"}`}>
            {result.message}
            {result.errors && Object.values(result.errors).flat().map((m) => ` ${m}`)}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Đang lưu…" : "Lưu giao diện"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setTheme(initial)}>
            Hoàn tác
          </Button>
        </div>
      </form>

      {/* Live preview: same tokens the storefront uses */}
      <section aria-label="Xem trước" className="h-fit overflow-hidden border-2 border-line xl:sticky xl:top-6">
        <p className="border-b border-line px-4 py-2 text-xs font-bold tracking-widest uppercase">Xem trước (chế độ tối)</p>
        <div style={previewVars} className="flex flex-col gap-6 bg-bg p-6 font-sans text-fg">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="font-display text-lg font-bold uppercase">Clothes Shop</span>
            <span className="text-xs uppercase opacity-70">Áo thun · Hoodie · Quần</span>
          </div>
          <p className="w-fit bg-accent px-2 py-0.5 text-xs font-bold tracking-widest text-on-accent uppercase">Drop mới</p>
          <h3 className="font-display text-5xl leading-none font-bold uppercase">Mặc là chất</h3>
          <p className="max-w-md text-muted">Tiêu đề, chữ, nút và thẻ sản phẩm dưới đây dùng đúng bộ màu và font bạn đang chọn.</p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex min-h-11 items-center rounded-box bg-accent px-5 text-sm font-bold tracking-wider text-on-accent uppercase">Mua ngay</span>
            <span className="inline-flex min-h-11 items-center rounded-box border-2 border-fg px-5 text-sm font-bold tracking-wider uppercase">Xem thêm</span>
          </div>
          <div className="grid max-w-md grid-cols-2 gap-3">
            {["Tee Oversized", "Hoodie Essential"].map((n, i) => (
              <div key={n} className="flex flex-col gap-2">
                <div className="aspect-[4/5] rounded-box bg-surface" />
                <span className="text-sm font-bold uppercase">{n}</span>
                <span className="text-sm">{i ? "590.000 ₫" : "290.000 ₫"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
