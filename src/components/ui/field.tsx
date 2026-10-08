import { useId, type ComponentProps } from "react";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: string;
};

/** Labelled input with inline error/hint wired via aria-describedby. */
export function Field({ label, error, hint, className = "", ...props }: FieldProps) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="min-h-11 rounded-box border-2 border-line bg-surface px-3 text-base text-fg placeholder:text-muted focus:border-accent focus:outline-none aria-invalid:border-danger"
        {...props}
      />
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
    </div>
  );
}
