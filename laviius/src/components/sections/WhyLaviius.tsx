"use client";

import { Check, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ROWS = [
  { traditional: "Phone calls", laviius: "Instant booking" },
  { traditional: "Email", laviius: "Digital" },
  { traditional: "Paper POD", laviius: "Live tracking" },
  { traditional: "No visibility", laviius: "Verified carriers" },
  { traditional: "Unknown ETA", laviius: "Digital documentation" },
];

export function WhyLaviius() {
  return (
    <section id="why-laviius" className="bg-slate-50/60 py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="Why Laviius"
          title="Not another broker. A better system."
          description="Same local carriers you'd call anyway — just without the calling."
        />

        <Reveal delay={0.1} className="mt-16">
          <div className="grid overflow-hidden rounded-3xl border border-slate-200 shadow-sm lg:grid-cols-2">
            <div className="bg-white p-8 sm:p-10">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Traditional Dispatch
              </h3>
              <ul className="mt-6 flex flex-col gap-5">
                {ROWS.map((row) => (
                  <li
                    key={row.traditional}
                    className="flex items-center gap-3 text-slate-500"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <span className="line-through decoration-slate-300">
                      {row.traditional}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-navy p-8 sm:p-10">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-electric-light">
                Laviius
              </h3>
              <ul className="mt-6 flex flex-col gap-5">
                {ROWS.map((row) => (
                  <li
                    key={row.laviius}
                    className="flex items-center gap-3 font-medium text-white"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald/20 text-emerald">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                    </span>
                    {row.laviius}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
