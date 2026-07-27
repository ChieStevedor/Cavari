import type { Metadata } from "next";
import { ShipmentWizard } from "@/components/wizard/ShipmentWizard";

export const metadata: Metadata = {
  title: "Request a Delivery — Laviius",
  description: "Book commercial local freight in under 60 seconds.",
};

export default function BookPage() {
  return (
    <main className="min-h-screen bg-white">
      <ShipmentWizard />
    </main>
  );
}
