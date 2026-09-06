"use client";

import { useRef, useState, useTransition } from "react";

import { addResearchItem } from "@/actions/ideas";
import type { ResearchItemType } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_LABELS: Record<ResearchItemType, string> = {
  reddit: "Reddit",
  app_store: "App Store",
  google_play: "Google Play",
  google_search: "Google search",
  competitor_site: "Competitor website",
  product_hunt: "Product Hunt",
  forum: "Forum",
  screenshot: "Screenshot",
  document: "Document",
  note: "Note",
};

export function ResearchItemForm({ ideaId }: { ideaId: string }) {
  const [type, setType] = useState<ResearchItemType>("note");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-lg border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          await addResearchItem(ideaId, {
            type,
            url: String(formData.get("url") || ""),
            title: String(formData.get("title") || ""),
            notes: String(formData.get("notes") || ""),
            evidence_strength: formData.get("evidence_strength")
              ? Number(formData.get("evidence_strength"))
              : undefined,
          });
          formRef.current?.reset();
          setType("note");
        });
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select value={type} onValueChange={(v) => setType(v as ResearchItemType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input name="title" placeholder="Title" />
        <Input name="url" placeholder="URL (optional)" type="url" />
      </div>
      <Textarea name="notes" placeholder="What did you find?" />
      <div className="flex items-center justify-between">
        <Select name="evidence_strength">
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Evidence strength (0-5)" />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Adding…" : "Add evidence"}
        </Button>
      </div>
    </form>
  );
}
