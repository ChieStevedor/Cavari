import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Lightbulb,
  FlaskConical,
  Package,
  Beaker,
  BarChart3,
  ListChecks,
  Archive,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Application structure per spec §4, in the specified order.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/validation", label: "Validation", icon: FlaskConical },
  { href: "/products", label: "Products", icon: Package },
  { href: "/experiments", label: "Experiments", icon: Beaker },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/decisions", label: "Decisions", icon: ListChecks },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/settings", label: "Settings", icon: Settings },
];
