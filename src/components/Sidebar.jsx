import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Package, ShoppingBag, Bell } from "lucide-react";
import { api } from "../lib/api";

const LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/catalog", label: "Catalog", icon: ShoppingBag },
  { to: "/handoffs", label: "Needs attention", icon: Bell, badgeCount: true },
];

export default function Sidebar() {
  // Polls every 30s so the "needs attention" badge doesn't require a
  // manual refresh to notice a new escalation came in — cheap enough
  // for a single-count query, not worth a websocket for this.
  const pendingQuery = useQuery({
    queryKey: ["handoffs", "pending"],
    queryFn: () => api.listHandoffs("pending"),
    refetchInterval: 30000,
  });
  const pendingCount = pendingQuery.data?.length || 0;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface px-3 py-5">
      <div className="mb-8 px-2">
        <div className="text-sm font-semibold text-ink">Your Business</div>
        <div className="text-xs text-muted">Orders, catalog & support</div>
      </div>
      <nav className="flex flex-col gap-1">
        {LINKS.map(({ to, label, icon: Icon, end, badgeCount }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-accent-soft text-accent-dark" : "text-muted hover:bg-paper hover:text-ink"
              }`
            }
          >
            <Icon size={16} strokeWidth={2} />
            <span className="flex-1">{label}</span>
            {badgeCount && pendingCount > 0 && (
              <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
