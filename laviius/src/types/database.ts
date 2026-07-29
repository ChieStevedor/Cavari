// TODO(types): Replace with generated types once the schema in
// /supabase/migrations stabilizes.
//
// Generate with the Supabase CLI once a project is linked:
//   npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
//
// Until then, this file documents the shape every table in
// /supabase/migrations is expected to produce, kept in sync by hand.
// Application code should import the `Tables<'x'>` helper below rather than
// reaching into `Database` directly, so the generated-file swap is a no-op.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// TODO: replace this hand-written stub with `supabase gen types` output.
export interface Database {
  public: {
    Tables: {
      users: { Row: Record<string, unknown> };
      companies: { Row: Record<string, unknown> };
      shipments: { Row: Record<string, unknown> };
      shipment_files: { Row: Record<string, unknown> };
      templates: { Row: Record<string, unknown> };
      carriers: { Row: Record<string, unknown> };
      audit_log: { Row: Record<string, unknown> };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
