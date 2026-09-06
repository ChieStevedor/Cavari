"use client";

import { useActionState } from "react";

import type { ActionResult } from "@/actions/ideas";
import type { Category, IdeaSource, Idea } from "@/lib/supabase/types";
import { SCORE_FACTOR_KEYS, SCORE_FACTOR_LABELS } from "@/lib/domain/scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold tracking-tight text-foreground">
      {children}
    </h3>
  );
}

export function IdeaForm({
  idea,
  categories,
  sources,
  action,
}: {
  idea?: Idea;
  categories: Category[];
  sources: IdeaSource[];
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-4">
        <SectionTitle>Basics</SectionTitle>
        <Field id="name" label="Name">
          <Input id="name" name="name" required defaultValue={idea?.name} />
        </Field>
        <Field id="description" label="Short description">
          <Textarea id="description" name="description" defaultValue={idea?.description ?? ""} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="category_id" label="Category">
            <Select name="category_id" defaultValue={idea?.category_id ?? undefined}>
              <SelectTrigger id="category_id" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="source_id" label="Source">
            <Select name="source_id" defaultValue={idea?.source_id ?? undefined}>
              <SelectTrigger id="source_id" className="w-full">
                <SelectValue placeholder="Where did this come from?" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field id="target_customer" label="Target customer">
          <Textarea id="target_customer" name="target_customer" defaultValue={idea?.target_customer ?? ""} />
        </Field>
        <Field id="problem" label="Problem">
          <Textarea id="problem" name="problem" defaultValue={idea?.problem ?? ""} />
        </Field>
        <Field id="solution" label="Proposed solution">
          <Textarea id="solution" name="solution" defaultValue={idea?.solution ?? ""} />
        </Field>
        <Field id="source_url" label="Source URL">
          <Input id="source_url" name="source_url" type="url" defaultValue={idea?.source_url ?? ""} />
        </Field>
        <Field id="founder_notes" label="Founder notes">
          <Textarea id="founder_notes" name="founder_notes" defaultValue={idea?.founder_notes ?? ""} />
        </Field>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <SectionTitle>Market</SectionTitle>
        <Field id="existing_alternatives" label="Existing alternatives">
          <Textarea id="existing_alternatives" name="existing_alternatives" defaultValue={idea?.existing_alternatives ?? ""} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="main_competitor" label="Main competitor">
            <Input id="main_competitor" name="main_competitor" defaultValue={idea?.main_competitor ?? ""} />
          </Field>
          <Field id="competitor_url" label="Competitor URL">
            <Input id="competitor_url" name="competitor_url" type="url" defaultValue={idea?.competitor_url ?? ""} />
          </Field>
          <Field id="competitor_pricing" label="Competitor pricing">
            <Input id="competitor_pricing" name="competitor_pricing" defaultValue={idea?.competitor_pricing ?? ""} />
          </Field>
          <Field id="market_size_estimate" label="Market size estimate">
            <Input id="market_size_estimate" name="market_size_estimate" defaultValue={idea?.market_size_estimate ?? ""} />
          </Field>
        </div>
        <Field id="competitor_reviews" label="Competitor reviews">
          <Textarea id="competitor_reviews" name="competitor_reviews" defaultValue={idea?.competitor_reviews ?? ""} />
        </Field>
        <Field id="search_intent_notes" label="Search intent notes">
          <Textarea id="search_intent_notes" name="search_intent_notes" defaultValue={idea?.search_intent_notes ?? ""} />
        </Field>
        <Field id="evidence_of_demand" label="Evidence of demand">
          <Textarea id="evidence_of_demand" name="evidence_of_demand" defaultValue={idea?.evidence_of_demand ?? ""} />
        </Field>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <SectionTitle>Product planning</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="mvp_complexity" label="MVP complexity">
            <Input id="mvp_complexity" name="mvp_complexity" placeholder="low / medium / high" defaultValue={idea?.mvp_complexity ?? ""} />
          </Field>
          <Field id="estimated_build_hours" label="Estimated build hours">
            <Input id="estimated_build_hours" name="estimated_build_hours" type="number" step="0.5" min="0" defaultValue={idea?.estimated_build_hours ?? ""} />
          </Field>
          <Field id="monetization_model" label="Monetization model">
            <Input id="monetization_model" name="monetization_model" placeholder="subscription / one_time / freemium / commission" defaultValue={idea?.monetization_model ?? ""} />
          </Field>
          <Field id="expected_price_cents" label="Expected price (USD)">
            <Input
              id="expected_price_cents"
              name="expected_price_cents"
              type="number"
              step="1"
              min="0"
              defaultValue={
                idea?.expected_price_cents != null
                  ? Math.round(idea.expected_price_cents / 100)
                  : ""
              }
            />
          </Field>
        </div>
        <Field id="required_integrations" label="Required integrations">
          <Input id="required_integrations" name="required_integrations" defaultValue={idea?.required_integrations ?? ""} />
        </Field>
        <Field id="technical_risks" label="Technical risks">
          <Textarea id="technical_risks" name="technical_risks" defaultValue={idea?.technical_risks ?? ""} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="distribution_channel" label="Distribution channel">
            <Input id="distribution_channel" name="distribution_channel" defaultValue={idea?.distribution_channel ?? ""} />
          </Field>
          <Field id="potential_moat" label="Potential moat">
            <Input id="potential_moat" name="potential_moat" defaultValue={idea?.potential_moat ?? ""} />
          </Field>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <SectionTitle>Opportunity Score (1-5 each, §8)</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SCORE_FACTOR_KEYS.map((key) => (
            <Field key={key} id={key} label={SCORE_FACTOR_LABELS[key]}>
              <Select name={key} defaultValue={idea?.[key]?.toString()}>
                <SelectTrigger id={key} className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <SectionTitle>Evidence Confidence (0-5, §9 — independent of the score above)</SectionTitle>
        <Field id="evidence_confidence" label="Evidence Confidence">
          <Select
            name="evidence_confidence"
            defaultValue={idea?.evidence_confidence?.toString()}
          >
            <SelectTrigger id="evidence_confidence" className="w-full sm:w-64">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 — Opinion</SelectItem>
              <SelectItem value="1">1 — Anecdotal</SelectItem>
              <SelectItem value="2">2 — Repeated</SelectItem>
              <SelectItem value="3">3 — Market evidence</SelectItem>
              <SelectItem value="4">4 — Strong evidence</SelectItem>
              <SelectItem value="5">5 — Commercial evidence</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : idea ? "Save changes" : "Create idea"}
        </Button>
      </div>
    </form>
  );
}
