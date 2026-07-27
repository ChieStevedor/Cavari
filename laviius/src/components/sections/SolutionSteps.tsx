"use client";

import { ClipboardCheck, Radar, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Request delivery",
    description:
      "Enter pickup, drop-off, and freight details in a simple form. No calls, no back-and-forth.",
  },
  {
    number: "02",
    icon: Truck,
    title: "Carrier assigned",
    description:
      "A verified local carrier is matched instantly based on capacity, equipment, and location.",
  },
  {
    number: "03",
    icon: Radar,
    title: "Track in real time",
    description:
      "Watch every stop live from pickup to drop-off, then get a digital proof of delivery automatically.",
  },
];

export function SolutionSteps() {
  return (
    <section id="how-it-works" className="bg-white py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Three steps. Sixty seconds. Zero phone calls."
          description="Laviius replaces dispatch chaos with a booking flow as simple as ordering a car."
        />

        <div className="relative mt-20 grid gap-12 lg:grid-cols-3 lg:gap-8">
          <div
            aria-hidden
            className="absolute top-8 left-[16.5%] right-[16.5%] hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent lg:block"
          />

          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.12}>
              <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-white shadow-lg shadow-navy/20">
                  <step.icon className="h-7 w-7" strokeWidth={1.75} />
                  <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-electric text-xs font-bold text-white ring-4 ring-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-slate-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
