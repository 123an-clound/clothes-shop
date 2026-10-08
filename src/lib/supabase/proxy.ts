import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const CUSTOMER_PATHS = ["/checkout", "/account", "/orders"];

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

/** Refreshes the Supabase session cookie and gates protected routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims() verifies the JWT; never trust getSession() on the server.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (!userId) return redirectToLogin(request);
    const { data: isAdmin } = await supabase.rpc("cs_is_admin");
    if (!isAdmin) return NextResponse.redirect(new URL("/", request.url));
  } else if (!userId && CUSTOMER_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    return redirectToLogin(request);
  }

  return response;
}
