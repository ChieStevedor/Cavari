"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { updateMvpScope } from "@/actions/products";
import type { Product } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function MvpScopeForm({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateMvpScope.bind(null, product.id),
    {},
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil />
          Edit MVP scope
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>MVP scope</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <Field id="mvp_core_problem" label="Core problem">
            <Input
              id="mvp_core_problem"
              name="mvp_core_problem"
              defaultValue={product.mvp_core_problem ?? ""}
            />
          </Field>
          <Field id="mvp_core_feature" label="Core feature">
            <Input
              id="mvp_core_feature"
              name="mvp_core_feature"
              defaultValue={product.mvp_core_feature ?? ""}
            />
          </Field>
          <Field
            id="mvp_must_have"
            label="Must have"
            hint="One item per line — required for the product to function."
          >
            <Textarea
              id="mvp_must_have"
              name="mvp_must_have"
              rows={4}
              defaultValue={product.mvp_must_have.join("\n")}
            />
          </Field>
          <Field
            id="mvp_should_have"
            label="Should have"
            hint="One item per line — can wait."
          >
            <Textarea
              id="mvp_should_have"
              name="mvp_should_have"
              rows={3}
              defaultValue={product.mvp_should_have.join("\n")}
            />
          </Field>
          <Field
            id="mvp_not_now"
            label="Not now"
            hint="One item per line — explicitly excluded, on purpose."
          >
            <Textarea
              id="mvp_not_now"
              name="mvp_not_now"
              rows={3}
              defaultValue={product.mvp_not_now.join("\n")}
            />
          </Field>
          <Field id="mvp_future" label="Future" hint="One item per line.">
            <Textarea
              id="mvp_future"
              name="mvp_future"
              rows={2}
              defaultValue={product.mvp_future.join("\n")}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
