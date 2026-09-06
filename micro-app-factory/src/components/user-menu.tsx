import { LogOut } from "lucide-react";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function UserMenu({ email }: { email: string | null }) {
  return (
    <div className="flex items-center gap-3">
      {email && (
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {email}
        </span>
      )}
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut />
          Sign out
        </Button>
      </form>
    </div>
  );
}
