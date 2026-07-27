"use client";

import { PhoneCall, Hourglass, EyeOff, CircleHelp, FileWarning } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const PAIN_POINTS = [
  {
    icon: PhoneCall,
    title: "Endless phone calls",
    description:
      "Calling five different carriers just to find one truck that's free today.",
  },
  {
    icon: Hourglass,
    title: "Waiting for quotes",
    description:
      "Hours pass before a number comes back — if it comes back at all.",
  },
  {
    icon: EyeOff,
    title: "No tracking",
    description:
      "Once the freight leaves the dock, it's a black box until it shows up.",
  },
  {
    icon: CircleHelp,
    title: "Uncertain ETAs",
    description:
      '"Sometime this afternoon" isn\'t a delivery window your customers can plan around.',
  },
  {
    icon: FileWarning,
    title: "Manual paperwork",
    description:
      "Paper PODs get lost, smudged, or never make it back to the office.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-slate-50/60 py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="The old way"
          title="Local dispatch hasn't changed in 30 years"
          description="Most local freight still runs on phone trees, spreadsheets, and hope. It works — barely — until it doesn't."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {PAIN_POINTS.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.06}>
              <div className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <point.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    {point.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
