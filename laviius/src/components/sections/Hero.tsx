"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DashboardMockup } from "@/components/illustrations/DashboardMockup";
import { PhoneMockup } from "@/components/illustrations/PhoneMockup";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified commercial carriers" },
  { icon: Zap, label: "Book in under 60 seconds" },
  { icon: Star, label: "98.6% on-time rate" },
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-white pt-36 pb-20 lg:pt-44 lg:pb-28"
    >
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-electric/10 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse-dot" />
              Now booking in Metro Vancouver
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-balance text-4xl font-bold tracking-tight text-navy sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]"
            >
              Commercial local freight.
              <br />
              Booked in under 60 seconds.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
            >
              Book trusted local cartage, white-glove, and same-day freight
              with complete visibility from pickup to proof of delivery.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Button href="mailto:hello@laviius.com?subject=Request%20a%20Delivery" size="lg">
                Request Delivery
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="mailto:carriers@laviius.com?subject=Carrier%20Application" variant="secondary" size="lg">
                Become a Carrier
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.36 }}
              className="mt-10 flex flex-wrap gap-x-6 gap-y-3"
            >
              {TRUST_POINTS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-sm text-slate-500"
                >
                  <Icon className="h-4 w-4 text-electric" />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <DashboardMockup />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-12 -right-4 w-[130px] sm:-right-16 sm:-bottom-14 sm:w-[170px]"
              >
                <PhoneMockup />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
