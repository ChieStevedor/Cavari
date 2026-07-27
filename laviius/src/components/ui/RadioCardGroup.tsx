import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  helper?: string;
  icon?: ReactNode;
}

interface RadioCardGroupProps<T extends string> {
  name: string;
  options: RadioCardOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  error?: string;
}

export function RadioCardGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  columns = 3,
  error,
}: RadioCardGroupProps<T>) {
  const cols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }[columns];

  return (
    <div>
      <div role="radiogroup" className={cn("grid gap-3", cols)}>
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-1 rounded-xl border-2 bg-white px-4 py-3 transition-all",
                checked
                  ? "border-electric bg-electric/5 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {opt.icon && (
                <span className={cn("mb-0.5", checked ? "text-electric" : "text-slate-400")}>
                  {opt.icon}
                </span>
              )}
              <span className={cn("text-sm font-semibold", checked ? "text-electric" : "text-navy")}>
                {opt.label}
              </span>
              {opt.helper && <span className="text-xs text-slate-500">{opt.helper}</span>}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
