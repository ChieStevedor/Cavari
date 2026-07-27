"use client";

import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const UPCOMING = ["Fraser Valley", "Vancouver Island", "Calgary", "Seattle"];

export function Coverage() {
  return (
    <section id="coverage" className="bg-white py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="Coverage"
          title="Live in Metro Vancouver"
          description="Deep local carrier density where we operate — with more regions on the way."
        />

        <Reveal delay={0.1} className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-navy px-8 py-16 sm:px-14">
            <div
              aria-hidden
              className="bg-grid pointer-events-none absolute inset-0 opacity-[0.08] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]"
              style={{ filter: "invert(1)" }}
            />

            <div className="relative flex flex-col items-center text-center">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald/30" />
                <span className="absolute h-14 w-14 rounded-full bg-emerald/20" />
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald text-white shadow-lg">
                  <MapPin className="h-5 w-5" strokeWidth={2} />
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-semibold text-white">
                Metro Vancouver
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-300">
                Same-day cartage, first &amp; last-mile, and white-glove
                delivery across the region — booked and tracked from one
                platform.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Expanding soon
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {UPCOMING.map((city) => (
                  <span
                    key={city}
                    className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-400"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
