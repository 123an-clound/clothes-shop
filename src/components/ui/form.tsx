import { useId, type ComponentProps } from "react";

const control =
  "min-h-11 w-full rounded-box border-2 border-line bg-surface px-3 text-base text-fg focus:border-accent-ink focus:outline-none aria-invalid:border-danger";

type Wrap = { label: string; error?: string; hint?: string; className?: string };

function Described({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  return [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(" ") || undefined;
}

export function SelectField({ label, error, hint, className = "", children, ...props }: ComponentProps<"select"> & Wrap) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-bold tracking-wider uppercase">
        {label}
      </label>
      <select id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} className={`${control} cursor-pointer`} {...props}>
        {children}
      </select>
      <Described id={id} error={error} hint={hint} />
    </div>
  );
}

export function TextareaField({ label, error, hint, className = "", ...props }: ComponentProps<"textarea"> & Wrap) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-bold tracking-wider uppercase">
        {label}
      </label>
      <textarea id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} className={`${control} min-h-28 py-2`} {...props} />
      <Described id={id} error={error} hint={hint} />
    </div>
  );
}

export function CheckboxField({ label, hint, className = "", ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-3 ${className}`}>
      <input type="checkbox" className="size-5 shrink-0 accent-[var(--accent-ink)]" {...props} />
      <span>
        <span className="text-sm font-bold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-fg pb-4">
      <h1 className="text-4xl uppercase sm:text-5xl">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
