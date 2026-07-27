"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

interface SaveAsTemplateModalProps {
  open: boolean;
  defaultName: string;
  onSave: (name: string) => void;
  onSkip: () => void;
}

export function SaveAsTemplateModal({ open, defaultName, onSave, onSkip }: SaveAsTemplateModalProps) {
  const [name, setName] = useState(defaultName);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm"
            onClick={onSkip}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-template-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Star className="h-5 w-5" fill="currentColor" />
            </span>
            <h2 id="save-template-title" className="mt-4 text-lg font-bold text-navy">
              Save as Template?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ship this route often? Save it so your next booking takes 10–15 seconds.
            </p>

            <TextField
              label="Template name"
              name="templateName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Richmond → Burnaby Warehouse Transfer"
              containerClassName="mt-4"
              autoFocus
            />

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={onSkip}>
                Not Now
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => onSave(name.trim() || defaultName)}
              >
                Save Template
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
