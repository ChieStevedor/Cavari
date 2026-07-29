import "server-only";

// Service-role Supabase client. Bypasses Row Level Security entirely.
//
// DO NOT use this for anything that serves an end-user request — user-facing
// route handlers must use lib/supabase/server.ts so RLS stays the security
// boundary. This client exists only for:
//   - trusted background jobs (e.g. scripts/backup-db.sh helpers)
//   - one-off admin/maintenance scripts run outside the request path
//
// SUPABASE_SERVICE_ROLE_KEY must never be exposed to the client bundle (no
// NEXT_PUBLIC_ prefix) and must never be logged. Rotate it per the schedule
// in docs/SECURITY.md if it is ever exposed.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "See .env.example.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
