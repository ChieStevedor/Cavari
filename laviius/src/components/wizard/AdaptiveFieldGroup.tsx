"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AdaptiveFieldGroupProps {
  /** Whether this field/group is currently relevant given the Adaptive Workflow rules. */
  visible: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Mounts/unmounts a field or field cluster in response to the Adaptive
 * Workflow rules (see lib/shipment/rules.ts), animating the reveal so the
 * form never jumps.
 */
export function AdaptiveFieldGroup({ visible, children, className }: AdaptiveFieldGroupProps) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className={className}
          style={{ overflow: "hidden" }}
        >
          <div className="pt-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
