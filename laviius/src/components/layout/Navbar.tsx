"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Platform", href: "#platform" },
  { label: "Why Laviius", href: "#why-laviius" },
  { label: "Coverage", href: "#coverage" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled || open
            ? "bg-white/80 backdrop-blur-lg shadow-[0_1px_0_0_rgba(15,23,42,0.06)]"
            : "bg-transparent",
        )}
      >
        <Container>
          <nav className="flex h-[72px] items-center justify-between py-4">
            <Link
              href="#top"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-navy"
              onClick={() => setOpen(false)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
                <Truck className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
              Laviius
            </Link>

            <div className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-navy"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <Button href="mailto:carriers@laviius.com?subject=Carrier%20Application" variant="ghost" size="md">
                Become a Carrier
              </Button>
              <Button href="mailto:hello@laviius.com?subject=Request%20a%20Delivery" variant="primary" size="md">
                Request Delivery
              </Button>
            </div>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-navy lg:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </nav>
        </Container>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-3 px-3">
              <Button
                href="mailto:carriers@laviius.com?subject=Carrier%20Application"
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Become a Carrier
              </Button>
              <Button
                href="mailto:hello@laviius.com?subject=Request%20a%20Delivery"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Request Delivery
              </Button>
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
