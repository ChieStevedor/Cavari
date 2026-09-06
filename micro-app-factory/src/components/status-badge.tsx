import { Badge } from "@/components/ui/badge";
import type { IdeaStatus, ProductStatus } from "@/lib/supabase/types";
import { IDEA_STATUS_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/domain/statuses";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline"
> = {
  IDEA: "outline",
  RESEARCHING: "secondary",
  SCORED: "info",
  VALIDATING: "info",
  APPROVED_TO_BUILD: "info",
  BUILDING: "warning",
  LAUNCHED: "warning",
  MEASURING: "warning",
  ITERATING: "warning",
  SCALE: "success",
  WINNER: "success",
  KILLED: "danger",
  ARCHIVED: "outline",
};

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
      {IDEA_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
      {PRODUCT_STATUS_LABELS[status]}
    </Badge>
  );
}
