import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FormField } from "./FormField";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  inputClassName?: string;
  leadingIcon?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, required, containerClassName, inputClassName, leadingIcon, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <FormField label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-navy placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-electric/40",
            !!leadingIcon && "pl-10",
            error ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-electric",
            inputClassName,
          )}
          {...props}
        />
      </div>
    </FormField>
  );
});
