import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FormField } from "./FormField";

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, error, hint, id, containerClassName, ...props }, ref) {
    const inputId = id ?? props.name;
    return (
      <FormField label={label} htmlFor={inputId} error={error} hint={hint} className={containerClassName}>
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          aria-invalid={!!error}
          className={cn(
            "w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-electric/40",
            error ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-electric",
          )}
          {...props}
        />
      </FormField>
    );
  },
);
