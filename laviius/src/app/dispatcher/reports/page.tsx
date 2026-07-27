import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/dispatcher/shared/ComingSoon";

export default function ReportsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Reports are coming soon"
      description="Exportable operational and financial reports built on the same KPIs shown on the console."
    />
  );
}
