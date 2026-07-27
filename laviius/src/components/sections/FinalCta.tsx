"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section id="cta" className="bg-slate-50/60 py-24 lg:py-32">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-16 text-center sm:px-16 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-electric/30 blur-3xl"
            />
            <div className="relative">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                Ready to simplify local freight?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-slate-300">
                Join the warehouses, 3PLs, and distributors booking trusted
                local carriers in under 60 seconds.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  href="mailto:hello@laviius.com?subject=Request%20a%20Delivery"
                  size="lg"
                >
                  Request Your First Delivery
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  href="mailto:carriers@laviius.com?subject=Carrier%20Application"
                  variant="secondaryDark"
                  size="lg"
                >
                  Become a Carrier
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
