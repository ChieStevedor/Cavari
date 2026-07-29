import "server-only";

// Server-side Supabase client for use in Server Components, Route Handlers,
// and Server Actions. Runs with the caller's session (via cookies), so RLS
// still applies — this is NOT a service-role client. This is the client
// almost everything in /app should use.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "See .env.example.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component that can't set cookies (e.g. during
          // static rendering). Safe to ignore as long as middleware refreshes
          // the session — see /docs/README.md, "Auth session refresh".
        }
      },
    },
  });
}
