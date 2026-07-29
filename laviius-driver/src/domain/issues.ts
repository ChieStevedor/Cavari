import type { Ionicons } from "@expo/vector-icons";
import type { IssueType } from "@/types/shipment";

export const ISSUE_TYPES: { type: IssueType; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { type: "damage", label: "Damage", icon: "alert-circle-outline" },
  { type: "customer_unavailable", label: "Customer Unavailable", icon: "person-remove-outline" },
  { type: "access_issue", label: "Access Issue", icon: "lock-closed-outline" },
  { type: "delay", label: "Delay", icon: "time-outline" },
  { type: "wrong_freight", label: "Wrong Freight", icon: "swap-horizontal-outline" },
  { type: "unsafe_conditions", label: "Unsafe Conditions", icon: "warning-outline" },
  { type: "vehicle_issue", label: "Vehicle Issue", icon: "car-outline" },
];
