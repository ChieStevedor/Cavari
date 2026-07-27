"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Hash, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SuccessScreenProps {
  referenceNumber: string;
}

export function SuccessScreen({ referenceNumber }: SuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 text-center"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10 text-emerald"
      >
        <CheckCircle2 className="h-9 w-9" />
      </motion.span>

      <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">Delivery Request Received</h1>
      <p className="mt-2 text-slate-500">
        We&apos;re matching your shipment with a trusted local carrier now.
      </p>

      <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-card p-6 text-left">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <Hash className="h-4 w-4" /> Reference Number
          </span>
          <span className="font-mono text-sm font-semibold text-navy">{referenceNumber}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-sm text-slate-500">Current Status</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse-dot" />
            Waiting for Carrier Assignment
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" /> Estimated Response Time
          </span>
          <span className="text-sm font-semibold text-navy">Under 15 minutes</span>
        </div>
      </div>

      <Button href="/dashboard" variant="primary" size="lg" className="mt-8 w-full">
        <LayoutDashboard className="h-4 w-4" />
        Go to Customer Dashboard
      </Button>
    </motion.div>
  );
}
