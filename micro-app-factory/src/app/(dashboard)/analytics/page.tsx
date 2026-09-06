import { getAnalyticsData } from "@/lib/data/analytics";
import { formatCents } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AnalyticsPage() {
  const { bySource, byCategory, efficiency } = await getAnalyticsData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Where profitable ideas actually come from — not opinions about it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factory Efficiency Score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <span className="text-2xl font-semibold">
            {efficiency.insufficientData ? "INSUFFICIENT DATA" : efficiency.score}
          </span>
          <p className="text-xs text-muted-foreground">
            An internal management metric (revenue/hour + validated hypotheses + winners) —
            not a universal business metric. Formula is configurable.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Idea Source Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Ideas</TableHead>
                <TableHead>Winners</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySource.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No ideas tagged with a source yet.
                  </TableCell>
                </TableRow>
              )}
              {bySource.map((s) => (
                <TableRow key={s.sourceName}>
                  <TableCell className="font-medium">{s.sourceName}</TableCell>
                  <TableCell>{s.ideas}</TableCell>
                  <TableCell>{s.winners}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Ideas</TableHead>
                <TableHead>MVPs</TableHead>
                <TableHead>Winners</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCategory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No categorized ideas yet.
                  </TableCell>
                </TableRow>
              )}
              {byCategory.map((c) => (
                <TableRow key={c.categoryName}>
                  <TableCell className="font-medium">{c.categoryName}</TableCell>
                  <TableCell>{c.ideas}</TableCell>
                  <TableCell>{c.mvps}</TableCell>
                  <TableCell>{c.winners}</TableCell>
                  <TableCell>{formatCents(c.revenueCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
