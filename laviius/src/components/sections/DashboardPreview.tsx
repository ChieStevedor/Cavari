"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Smartphone, Truck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DashboardMockup } from "@/components/illustrations/DashboardMockup";
import { PhoneFrame } from "@/components/illustrations/PhoneFrame";
import { TrackingScreen } from "@/components/illustrations/TrackingScreen";
import { DriverAppScreen } from "@/components/illustrations/DriverAppScreen";

const TABS = [
  {
    id: "dispatcher",
    label: "Dispatcher Dashboard",
    icon: LayoutDashboard,
    description:
      "Command center for coordinators — see every active job, carrier, and route at a glance.",
  },
  {
    id: "tracking",
    label: "Customer Tracking",
    icon: Smartphone,
    description:
      "Share a live link with your customer so they always know exactly when freight arrives.",
  },
  {
    id: "driver",
    label: "Driver Mobile App",
    icon: Truck,
    description:
      "Turn-by-turn navigation, job details, and one-tap proof of delivery for carriers.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DashboardPreview() {
  const [active, setActive] = useState<TabId>("dispatcher");
  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <section id="platform" className="bg-white py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="One platform, every role"
          title="Built for dispatchers, customers, and drivers alike"
          description="Every stakeholder gets the view they need — without a single phone call between them."
        />

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors",
                active === tab.id
                  ? "border-navy bg-navy text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-navy",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative mt-10 flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8 sm:p-14">
          <div
            aria-hidden
            className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex w-full flex-col items-center gap-8"
            >
              {active === "dispatcher" ? (
                <div className="w-full max-w-xl">
                  <DashboardMockup />
                </div>
              ) : (
                <PhoneFrame size="lg">
                  {active === "tracking" ? (
                    <TrackingScreen />
                  ) : (
                    <DriverAppScreen />
                  )}
                </PhoneFrame>
              )}
              <p className="max-w-md text-balance text-center text-sm text-slate-500">
                {activeTab.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
