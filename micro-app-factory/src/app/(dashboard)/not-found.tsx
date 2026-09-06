import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 pt-16 text-center">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="text-sm text-muted-foreground">
        This item doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back to Command Center</Link>
      </Button>
    </div>
  );
}
