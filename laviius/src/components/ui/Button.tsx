import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "secondaryDark" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-electric text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_24px_-8px_rgba(37,99,235,0.55)] hover:bg-electric-light hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_12px_28px_-8px_rgba(37,99,235,0.65)] active:scale-[0.98]",
  secondary:
    "bg-white text-navy border border-slate-200 shadow-sm hover:border-navy/30 hover:bg-slate-50 active:scale-[0.98]",
  secondaryDark:
    "bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-[0.98]",
  ghost: "text-navy hover:bg-navy/5 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-[52px] px-7 text-base",
};

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
