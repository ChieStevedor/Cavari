import Link from "next/link";
import { Plus } from "lucide-react";

import { getIdeas } from "@/lib/data/ideas";
import { getCategories } from "@/lib/data/lookups";
import { IDEA_STATUS_ORDER, IDEA_STATUS_LABELS } from "@/lib/domain/statuses";
import { interpretOpportunityScore } from "@/lib/domain/scoring";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IdeaStatusBadge } from "@/components/status-badge";
import type { IdeaStatus } from "@/lib/supabase/types";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [ideas, categories] = await Promise.all([
    getIdeas({
      status: (params.status as IdeaStatus) || undefined,
      categoryId: params.category || undefined,
      search: params.q || undefined,
    }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Ideas</h1>
          <p className="text-sm text-muted-foreground">
            {ideas.length} idea{ideas.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/ideas/new">
            <Plus />
            New idea
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            name="q"
            placeholder="Search by name…"
            defaultValue={params.q}
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <Select name="status" defaultValue={params.status}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {IDEA_STATUS_ORDER.concat(["KILLED", "ARCHIVED"]).map((s) => (
                <SelectItem key={s} value={s}>
                  {IDEA_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Category
          </label>
          <Select name="category" defaultValue={params.category}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {(params.q || params.status || params.category) && (
          <Button asChild variant="ghost">
            <Link href="/ideas">Clear</Link>
          </Button>
        )}
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ideas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No ideas match these filters yet.
                </TableCell>
              </TableRow>
            )}
            {ideas.map((idea) => (
              <TableRow key={idea.id}>
                <TableCell className="font-medium">
                  <Link href={`/ideas/${idea.id}`} className="hover:underline">
                    {idea.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {idea.category?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <IdeaStatusBadge status={idea.status} />
                </TableCell>
                <TableCell>
                  {idea.opportunity_score}/30 ·{" "}
                  <span className="text-muted-foreground">
                    {interpretOpportunityScore(idea.opportunity_score)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {idea.evidence_confidence ?? "—"}/5
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(idea.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
