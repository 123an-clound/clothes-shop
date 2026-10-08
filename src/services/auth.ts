import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string };

/** Verified user from the session cookie, or null. Reads cookies: call inside a Suspense boundary. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("cs_is_admin");
  return data === true;
}

/** Use at the top of every customer Server Action / page; proxy.ts is not the only guard. */
export async function requireUser(nextPath = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Use at the top of every admin Server Action / page; RLS enforces the same rule in the DB. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (!(await isAdmin())) redirect("/");
  return user;
}
