import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";
import { Badge } from "./Badge";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center"
          ? "items-center text-center mx-auto max-w-2xl"
          : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <Badge>{eyebrow}</Badge>
        </Reveal>
      )}
      <Reveal delay={0.08}>
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.14}>
          <p className="text-balance text-lg leading-relaxed text-slate-600">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
