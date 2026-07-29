import { NextResponse } from "next/server";
import { createShipmentSchema } from "@/lib/validation/shipment";
import { createClient } from "@/lib/supabase/server";

// TODO(api): This is a scaffold, not a finished endpoint. Still needed
// before this is production-ready:
//   - Rate limiting (Upstash Redis + sliding-window limiter) — see
//     SECURITY.md, "API Hardening". Public booking endpoints are the
//     explicit example called out for abuse protection.
//   - CORS restricted to known origins.
//   - Audit log write on create (see supabase/migrations for audit_log).
//   - Structured logging of failed-auth / RLS-denial events without
//     logging declared value or contact PII (SECURITY.md).
//
// What this scaffold already demonstrates: server-side revalidation with
// the *same* Zod schema the client form will use, and going through the
// RLS-scoped server client rather than a service-role client — the two
// non-negotiables from the master prompt.

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createShipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // TODO: insert into `shipments` via the RLS-scoped client above once the
  // migration in supabase/migrations lands, then write the audit_log entry.
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 },
  );
}
