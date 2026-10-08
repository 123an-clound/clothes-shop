"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { FormState } from "./actions";

type FieldDef = {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  hint?: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: FieldDef[];
  submitLabel: string;
};

export function AuthForm({ action, fields, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  // Controlled email survives React's automatic form reset after an action.
  const [email, setEmail] = useState("");
  const next = useSearchParams().get("next") ?? "/";

  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  if (state.ok) {
    return (
      <p role="status" className="border-2 border-accent p-4 text-sm">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      {fields.map((f) => (
        <Field
          key={f.name}
          name={f.name}
          label={f.label}
          type={f.type}
          autoComplete={f.autoComplete}
          hint={f.hint}
          required
          error={state.errors?.[f.name]?.[0]}
          {...(f.type === "email" ? { value: email, onChange: (e) => setEmail(e.target.value) } : {})}
        />
      ))}
      {state.message && (
        <p role="alert" className="border-l-4 border-danger pl-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending || Boolean(state.redirectTo)} aria-busy={pending}>
        {pending || state.redirectTo ? "Đang xử lý…" : submitLabel}
      </Button>
    </form>
  );
}
