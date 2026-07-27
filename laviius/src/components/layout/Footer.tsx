import Link from "next/link";
import { Truck, Mail, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";

const COLUMNS = [
  {
    heading: "Solutions",
    links: [
      { label: "Same-Day Cartage", href: "#features" },
      { label: "White Glove Delivery", href: "#features" },
      { label: "First & Last-Mile", href: "#features" },
      { label: "Real-Time Tracking", href: "#platform" },
    ],
  },
  {
    heading: "Carriers",
    links: [
      {
        label: "Become a Carrier",
        href: "mailto:carriers@laviius.com?subject=Carrier%20Application",
      },
      { label: "Carrier Requirements", href: "#why-laviius" },
      { label: "Driver App", href: "#platform" },
    ],
  },
  {
    heading: "Industries",
    links: [
      { label: "Warehouses & DCs", href: "#features" },
      { label: "3PLs", href: "#features" },
      { label: "Retail Distributors", href: "#features" },
      { label: "Manufacturers", href: "#features" },
    ],
  },
  {
    heading: "Contact",
    links: [
      {
        label: "hello@laviius.com",
        href: "mailto:hello@laviius.com",
        icon: Mail,
      },
      { label: "Metro Vancouver, BC", href: "#coverage", icon: MapPin },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link
              href="#top"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-navy"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
                <Truck className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
              Laviius
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              The booking platform for commercial local freight — connecting
              warehouses, 3PLs, and distributors with trusted local carriers.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-navy">
                {col.heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-electric"
                    >
                      {"icon" in link && link.icon ? (
                        <link.icon className="h-3.5 w-3.5 shrink-0" />
                      ) : null}
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Laviius. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#privacy"
              className="text-xs text-slate-400 transition-colors hover:text-navy"
            >
              Privacy
            </a>
            <a
              href="#terms"
              className="text-xs text-slate-400 transition-colors hover:text-navy"
            >
              Terms
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
