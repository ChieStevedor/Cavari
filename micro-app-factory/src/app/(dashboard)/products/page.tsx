import Link from "next/link";

import { getProducts } from "@/lib/data/products";
import { getCategories } from "@/lib/data/lookups";
import { getMetricsForProduct } from "@/lib/data/products";
import { computeProductHealth } from "@/lib/domain/health-score";
import { PRODUCT_STATUS_LABELS } from "@/lib/domain/statuses";
import { formatCents, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductStatusBadge } from "@/components/status-badge";

const STATUSES = Object.keys(PRODUCT_STATUS_LABELS);

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts({
      status: params.status || undefined,
      categoryId: params.category || undefined,
      search: params.q || undefined,
    }),
    getCategories(),
  ]);

  const withHealth = await Promise.all(
    products.map(async (p) => ({
      product: p,
      health: computeProductHealth(await getMetricsForProduct(p.id)),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          {products.length} product{products.length === 1 ? "" : "s"}
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <Input name="q" placeholder="Search by name…" defaultValue={params.q} className="w-56" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select name="status" defaultValue={params.status}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PRODUCT_STATUS_LABELS[s as keyof typeof PRODUCT_STATUS_LABELS]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
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
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Maturity</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Launch date</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withHealth.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No products match these filters yet.
                </TableCell>
              </TableRow>
            )}
            {withHealth.map(({ product, health }) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <Link href={`/products/${product.id}`} className="hover:underline">
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{product.maturity}/6</TableCell>
                <TableCell className="text-muted-foreground">
                  {health.insufficientData ? "INSUFFICIENT DATA" : `${health.score}/100`}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(product.launch_date)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCents(product.price_cents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
