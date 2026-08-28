import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import EmptyState from "../components/EmptyState";

function StatCard({ label, value, hint, alert }) {
  return (
    <div className={`rounded-[10px] border p-5 ${alert ? "border-danger/30 bg-danger-soft" : "border-line bg-surface"}`}>
      <div className={`text-xs font-medium ${alert ? "text-danger" : "text-muted"}`}>{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular ${alert ? "text-danger" : "text-ink"}`}>{value}</div>
      {hint && <div className={`mt-1 text-xs ${alert ? "text-danger" : "text-muted"}`}>{hint}</div>}
    </div>
  );
}

function CategoryBreakdown({ title, data, labels }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return (
    <div className="rounded-[10px] border border-line bg-surface p-5">
      <div className="mb-3 text-sm font-medium text-ink">{title}</div>
      <div className="space-y-2">
        {Object.entries(labels).map(([key, label]) => {
          const count = data[key] || 0;
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-muted">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right tabular text-ink">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CATEGORY_LABELS = {
  delivery: "Delivery",
  payment: "Payment",
  refund: "Refund",
  complaint: "Complaint",
  product_enquiry: "Product enquiry",
  other: "Other",
};
const URGENCY_LABELS = { high: "High", medium: "Medium", low: "Low" };

// BUILDFEST DEMO BUILD -- this used to show subscription/plan/billing
// stats (days left, conversation quota) pulled from api.getMyTenant(),
// which lived on the now-deleted onboarding.py. Rebuilt around
// GET /analytics/me instead -- this is the case study's "basic record
// or summary of the interaction" deliverable: how many conversations
// came in, how orders broke down by status, what still needs a human
// ("Needs attention"), and how open conversations break down by
// category/urgency (from ai_engine's app/classify.py).
export default function DashboardHomePage() {
  const query = useQuery({
    queryKey: ["my-business-overview"],
    queryFn: () => api.getMyBusinessOverview(),
  });
  const handoffsQuery = useQuery({
    queryKey: ["handoffs", "pending"],
    queryFn: () => api.listHandoffs("pending"),
  });

  if (query.isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (query.isError) {
    return (
      <EmptyState
        title="Couldn't load your dashboard"
        detail={query.error?.response?.data?.detail || query.error?.message}
      />
    );
  }

  const t = query.data;
  const pendingCount = handoffsQuery.data?.length || 0;
  const ordersToday = t.orders.last_30_days;
  const openOrders =
    (ordersToday.pending_payment || 0) +
    (ordersToday.proof_submitted || 0) +
    (ordersToday.processing || 0) +
    (ordersToday.awaiting_delivery_confirmation || 0);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-lg font-semibold text-ink">{t.business_name}</h1>
      <p className="mb-6 text-sm text-muted">Support & order activity</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link to="/handoffs">
          <StatCard
            label="Needs attention"
            value={pendingCount}
            hint={pendingCount > 0 ? "tap to review →" : "all clear"}
            alert={pendingCount > 0}
          />
        </Link>
        <StatCard label="Conversations (30d)" value={t.conversations.last_30_days} hint={`${t.conversations.all_time} all time`} />
        <StatCard label="Open orders (30d)" value={openOrders} hint="pending, processing, or awaiting confirmation" />
        <StatCard label="Completed orders (30d)" value={ordersToday.completed || 0} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryBreakdown title="Open enquiries by category" data={t.enquiries_by_category} labels={CATEGORY_LABELS} />
        <CategoryBreakdown title="Open enquiries by urgency" data={t.enquiries_by_urgency} labels={URGENCY_LABELS} />
      </div>

      <div className="mt-6 rounded-[10px] border border-line bg-surface p-5">
        <div className="mb-3 text-sm font-medium text-ink">Quick links</div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/orders" className="text-accent-dark hover:underline">See your orders →</Link>
          <Link to="/catalog" className="text-accent-dark hover:underline">Manage catalog →</Link>
          <Link to="/handoffs" className="text-accent-dark hover:underline">Review escalations →</Link>
        </div>
      </div>
    </div>
  );
}
