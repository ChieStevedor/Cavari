"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Gauge,
  LayoutGrid,
  Map as MapIcon,
  Package,
  Settings,
  ShieldAlert,
  Truck,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dispatcher", icon: Gauge },
  { label: "Shipments", href: "/dispatcher/shipments", icon: Package },
  { label: "Dispatch Queue", href: "/dispatcher/queue", icon: LayoutGrid },
  { label: "Carriers", href: "/dispatcher/carriers", icon: Truck },
  { label: "Drivers", href: "/dispatcher/drivers", icon: UsersRound },
  { label: "Customers", href: "/dispatcher/customers", icon: Users },
  { label: "Live Map", href: "/dispatcher/live-map", icon: MapIcon },
  { label: "Claims", href: "/dispatcher/claims", icon: ShieldAlert },
  { label: "Reports", href: "/dispatcher/reports", icon: BarChart3 },
  { label: "Settings", href: "/dispatcher/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dispatcher navigation"
      className="hidden w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-slate-200 bg-white px-2.5 py-3 md:flex"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-electric/10 text-electric" : "text-slate-500 hover:bg-slate-100 hover:text-navy",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
