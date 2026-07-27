import { cn } from "@/lib/cn";

export function PhoneFrame({
  children,
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "w-full overflow-hidden rounded-[28px] border-[6px] border-navy bg-navy shadow-2xl shadow-slate-900/20",
        size === "sm" ? "max-w-[220px]" : "max-w-[260px]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[22px] bg-white">
        <div className="mx-auto mt-1.5 h-4 w-20 rounded-full bg-navy" />
        {children}
      </div>
    </div>
  );
}
