"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { File as FileIcon, RefreshCw, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { UploadedFile } from "@/types/shipment";
import { generateId } from "@/lib/shipment/id";

interface UploadZoneProps {
  label: string;
  hint: string;
  accept: string;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

const MAX_RETRIES = 2;

/** Simulates a flaky upload backend, retrying transient failures on its own. */
function simulateUpload(onStatus: (status: UploadedFile["status"]) => void, attempt = 1) {
  window.setTimeout(
    () => {
      const transientFailure = Math.random() < 0.12 && attempt <= MAX_RETRIES;
      if (transientFailure) {
        onStatus("error");
        simulateUpload(onStatus, attempt + 1);
        return;
      }
      onStatus("done");
    },
    600 + attempt * 250,
  );
}

export function UploadZone({ label, hint, accept, files, onChange, maxFiles = 8 }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const markStatus = useCallback(
    (id: string, status: UploadedFile["status"]) => {
      if (!filesRef.current.some((f) => f.id === id)) return; // removed while "uploading"
      onChange(filesRef.current.map((f) => (f.id === id ? { ...f, status } : f)));
    },
    [onChange],
  );

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const room = Math.max(0, maxFiles - files.length);
      const selected = Array.from(incoming).slice(0, room);
      if (selected.length === 0) return;

      const newEntries: UploadedFile[] = selected.map((f) => ({
        id: generateId("file"),
        name: f.name,
        size: f.size,
        type: f.type,
        status: "uploading",
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));

      onChange([...files, ...newEntries]);
      newEntries.forEach((entry) => simulateUpload((status) => markStatus(entry.id, status)));
    },
    [files, maxFiles, onChange, markStatus],
  );

  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  return (
    <div>
      <p className="text-sm font-medium text-navy">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-electric bg-electric/5" : "border-slate-200 hover:border-slate-300",
        )}
      >
        <UploadCloud className={cn("h-6 w-6", dragging ? "text-electric" : "text-slate-400")} />
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-electric">Click to upload</span> or drag and drop
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {files.map((f) => (
              <motion.li
                key={f.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 overflow-hidden rounded-lg border border-slate-200 px-3 py-2"
              >
                {f.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.previewUrl} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-400">
                    <FileIcon className="h-4 w-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-navy">{f.name}</span>
                {f.status === "uploading" && (
                  <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
                )}
                {f.status === "error" && (
                  <span className="shrink-0 text-xs font-medium text-amber-600">Retrying…</span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                  className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
