"use client";

import {
  Zap,
  HandHeart,
  Radar,
  FileCheck2,
  BadgeCheck,
  Receipt,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const FEATURES = [
  {
    icon: Zap,
    title: "Same-Day Cartage",
    description:
      "Book a truck for pickup within the hour. Built for freight that can't wait until tomorrow.",
  },
  {
    icon: HandHeart,
    title: "White Glove",
    description:
      "Trained crews for sensitive, high-value, or inside deliveries that need extra care.",
  },
  {
    icon: Radar,
    title: "Real-Time Tracking",
    description:
      "Live GPS visibility on every shipment, from dispatch to the final signature.",
  },
  {
    icon: FileCheck2,
    title: "Digital POD",
    description:
      "Timestamped, photo-backed proof of delivery — automatically filed, never lost.",
  },
  {
    icon: BadgeCheck,
    title: "Certified Carriers",
    description:
      "Every carrier is vetted for insurance, licensing, and commercial freight experience.",
  },
  {
    icon: Receipt,
    title: "Transparent Pricing",
    description:
      "See the price before you book. No surprise accessorials, no negotiating.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-slate-50/60 py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="Platform"
          title="Everything local freight needs, nothing it doesn't"
          description="Built for warehouses, 3PLs, and distributors who need freight to move — and proof that it did."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-electric/30 hover:shadow-xl hover:shadow-slate-900/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/5 text-navy transition-colors group-hover:bg-electric group-hover:text-white">
                  <feature.icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
