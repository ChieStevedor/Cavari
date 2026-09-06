import Link from "next/link";

import { getAllExperiments } from "@/lib/data/validation";
import { EXPERIMENT_STATUS_LABELS } from "@/lib/domain/statuses";
import { formatCents, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ValidationListPage() {
  const experiments = await getAllExperiments();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Validation</h1>
        <p className="text-sm text-muted-foreground">
          Every experiment running or completed across all ideas.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Idea</TableHead>
              <TableHead>Experiment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Revenue target</TableHead>
              <TableHead>Window</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No validation experiments yet.
                </TableCell>
              </TableRow>
            )}
            {experiments.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  {e.idea ? (
                    <Link href={`/ideas/${e.idea.id}/validate`} className="hover:underline">
                      {e.idea.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{EXPERIMENT_STATUS_LABELS[e.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{e.channel ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCents(e.revenue_target_cents)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(e.start_date)} → {formatDate(e.end_date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
