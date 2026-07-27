import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, icon, children, className }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      {(title || description) && (
        <div className="mb-5 flex items-start gap-3">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric/10 text-electric">
              {icon}
            </span>
          )}
          <div>
            {title && <h3 className="text-base font-semibold text-navy">{title}</h3>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
