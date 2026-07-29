// TODO(dashboard): Customer dashboard entry point.
//
// Expected responsibilities once implemented:
//   - Require an authenticated Supabase session (redirect to /login otherwise).
//   - List the current user's/company's shipments (status, reference number).
//   - Surface saved templates ("Save as Template" bookings) for quick re-booking.
//   - Read access must go through RLS-scoped queries (lib/supabase/server.ts) —
//     never a service-role client — so a signed-in user only ever sees rows
//     belonging to their own user_id/company_id.
//
// Role-based views (customer vs. dispatch/admin) belong here too, gated both
// by RLS policy and by an explicit server-side role check — see SECURITY.md,
// "Authentication & Authorization".

export default function DashboardPage() {
  return null;
}
