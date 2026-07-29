"use client";

// Browser-side Supabase client. Uses the anon key only — this key is public
// by design and relies entirely on Row Level Security to restrict access.
// Never import the service-role key here or in any file bundled for the client.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "See .env.example.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
