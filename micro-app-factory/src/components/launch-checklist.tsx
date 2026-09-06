"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { addChecklistItem, toggleChecklistItem } from "@/actions/products";
import type { LaunchChecklistItem } from "@/lib/supabase/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LaunchChecklist({
  productId,
  items,
}: {
  productId: string;
  items: LaunchChecklistItem[];
}) {
  const [, startTransition] = useTransition();
  const [newLabel, setNewLabel] = useState("");
  const completed = items.filter((i) => i.completed).length;
  const percent = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Progress value={percent} className="flex-1" />
        <span className="text-sm font-medium text-muted-foreground">
          {completed}/{items.length} ({percent}%)
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={(checked) =>
                startTransition(() =>
                  toggleChecklistItem(productId, item.id, checked === true),
                )
              }
            />
            <span className={item.completed ? "text-muted-foreground line-through" : ""}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await addChecklistItem(productId, newLabel);
            setNewLabel("");
          });
        }}
      >
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add a custom checklist item"
          className="flex-1"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!newLabel.trim()}>
          <Plus />
          Add
        </Button>
      </form>
    </div>
  );
}
