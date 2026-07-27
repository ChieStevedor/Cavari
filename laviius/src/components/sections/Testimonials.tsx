"use client";

import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TESTIMONIALS = [
  {
    quote:
      "We used to spend an hour every morning just lining up trucks. Now I book same-day cartage in under a minute and I can see exactly where it is the whole way.",
    name: "Danielle Ferreira",
    title: "Warehouse Manager",
    company: "Pacific Rim Distribution",
  },
  {
    quote:
      "Digital POD alone paid for itself. No more chasing paper tickets or arguing with customers about whether a delivery actually happened on time.",
    name: "Marcus Chen",
    title: "3PL Operations Manager",
    company: "Coastal Fulfillment Partners",
  },
  {
    quote:
      "White glove delivery used to be our biggest headache. Laviius carriers show up on time, every time, and our customers actually notice the difference.",
    name: "Priya Nair",
    title: "Owner",
    company: "Beacon Home Furnishings",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

export function Testimonials() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="Trusted on the ground"
          title="Teams who've ditched the phone tree"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <figure className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-card p-8">
                <div>
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-5 text-[15px] leading-relaxed text-slate-600">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>
                <figcaption className="mt-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
                    {initials(t.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {t.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.title} &middot; {t.company}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
