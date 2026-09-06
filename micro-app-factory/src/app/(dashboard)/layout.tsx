import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/20 md:flex md:flex-col">
        <div className="px-4 py-4">
          <span className="text-sm font-semibold tracking-tight">
            AI Micro-App Factory
          </span>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3">
          <span className="text-sm font-semibold tracking-tight md:hidden">
            AI Micro-App Factory
          </span>
          <div className="hidden md:block" />
          <UserMenu email={user?.email ?? null} />
        </header>
        <MobileNav />
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
