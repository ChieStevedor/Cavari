import Link from "next/link";

import { getIdeas } from "@/lib/data/ideas";
import { getProducts } from "@/lib/data/products";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaStatusBadge, ProductStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ArchivePage() {
  const [killedIdeas, archivedIdeas, killedProducts, archivedProducts] = await Promise.all([
    getIdeas({ status: "KILLED" }),
    getIdeas({ status: "ARCHIVED" }),
    getProducts({ status: "KILLED" }),
    getProducts({ status: "ARCHIVED" }),
  ]);
  const ideas = [...killedIdeas, ...archivedIdeas];
  const products = [...killedProducts, ...archivedProducts];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Killed and archived work, preserved for learning — not deleted.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Launched</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    Nothing archived yet.
                  </TableCell>
                </TableRow>
              )}
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link href={`/products/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.launch_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ideas ({ideas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    Nothing archived yet.
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
                  <TableCell>
                    <IdeaStatusBadge status={idea.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(idea.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
