import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";

export function ComingSoon({ icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <Link href="/dispatcher/queue" className="text-sm font-semibold text-electric hover:underline">
            Go to Dispatch Queue →
          </Link>
        }
        className="mt-6"
      />
    </div>
  );
}
