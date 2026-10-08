import type { ComponentProps } from "react";

type Variant = "primary" | "outline" | "ghost";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-box px-5 text-sm font-bold uppercase tracking-wider " +
  "cursor-pointer transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-fg hover:text-bg",
  outline: "border-2 border-fg text-fg hover:bg-fg hover:text-bg",
  ghost: "text-fg hover:bg-surface",
};

export function buttonClass(variant: Variant = "primary", className = "") {
  return `${BASE} ${VARIANTS[variant]} ${className}`;
}

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
