import type { ReactNode } from "react";
import { Pencil } from "lucide-react";

interface ReviewCardProps {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}

export function ReviewCard({ title, onEdit, children }: ReviewCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-sm font-medium text-electric hover:text-electric-light"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}
