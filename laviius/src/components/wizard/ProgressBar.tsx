"use client";

import { motion } from "framer-motion";

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1 w-full overflow-hidden bg-slate-100" aria-hidden="true">
      <motion.div
        className="h-full bg-electric"
        initial={false}
        animate={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
      />
    </div>
  );
}
