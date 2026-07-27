import type { Metadata } from "next";
import { DispatcherProvider } from "@/lib/dispatcher/store";
import { ConsoleShell } from "@/components/dispatcher/layout/ConsoleShell";

export const metadata: Metadata = {
  title: "Dispatcher Console — Laviius",
  description: "Operational command center for dispatching local commercial freight.",
};

export default function DispatcherLayout({ children }: { children: React.ReactNode }) {
  return (
    <DispatcherProvider>
      <ConsoleShell>{children}</ConsoleShell>
    </DispatcherProvider>
  );
}
