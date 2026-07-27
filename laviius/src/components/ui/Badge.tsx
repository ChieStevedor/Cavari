import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-electric/20 bg-electric/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-electric",
        className,
      )}
    >
      {children}
    </span>
  );
}
