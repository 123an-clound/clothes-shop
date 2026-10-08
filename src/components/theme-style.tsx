import type { Settings } from "@/lib/validation/settings";

const FONT_VAR = {
  "space-grotesk": "var(--font-space-grotesk)",
  inter: "var(--font-inter)",
  "be-vietnam-pro": "var(--font-be-vietnam-pro)",
} as const;

const RADIUS = { none: "0px", sm: "4px", md: "10px" } as const;

/**
 * Injects admin theme as CSS variables. Safe to interpolate: every value is a Zod-validated
 * hex color or comes from the fixed maps above, never raw admin text.
 */
export function ThemeStyle({ theme }: { theme: Settings["theme"] }) {
  const css = `:root{--bg:${theme.background};--fg:${theme.foreground};--accent:${theme.accent};--radius:${RADIUS[theme.radius]};--font-heading:${FONT_VAR[theme.font_display]};--font-body:${FONT_VAR[theme.font_body]}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
