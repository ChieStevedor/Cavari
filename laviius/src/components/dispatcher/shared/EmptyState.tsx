import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
        <Icon className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
