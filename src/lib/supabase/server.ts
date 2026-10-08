import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/types/database";

/** Session-bound client for Server Components / Actions. RLS applies as the signed-in user. */
export async function createClient() {
  // Session clients are always request-time: auth-js reads Date.now() to check token expiry,
  // which Next forbids during (runtime) prerender/prefetch.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component: cookies are read-only there; proxy.ts refreshes the session.
          }
        },
      },
    },
  );
}
