import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../lib/api";
import { ORDER_STATUS_META } from "../lib/options";
import EmptyState from "../components/EmptyState";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

const CANCELLABLE_STATUSES = new Set(["pending_payment", "proof_submitted", "payment_confirmed", "processing"]);

function StatusBadge({ status }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color: meta?.color, backgroundColor: `${meta?.color}1a` }}
    >
      {meta?.label || status}
    </span>
  );
}

function ConfirmRejectAction({ label, onConfirm, onReject, busy }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (rejecting) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <input
          className="flex-1 rounded-[6px] border border-line px-2 py-1 text-xs"
          placeholder="Reason for rejecting"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button variant="danger" className="!px-2 !py-1 !text-xs" onClick={() => onReject(reason)} disabled={!reason || busy}>
          Confirm reject
        </Button>
        <button onClick={() => setRejecting(false)} className="text-xs text-muted hover:text-ink">Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button className="!px-2.5 !py-1 !text-xs" onClick={onConfirm} disabled={busy}>
        {label}
      </Button>
      <Button variant="secondary" className="!px-2.5 !py-1 !text-xs" onClick={() => setRejecting(true)} disabled={busy}>
        Reject
      </Button>
    </div>
  );
}

function OrderActions({ order }) {
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["order-status-counts"] });
  }

  const verifyMutation = useMutation({
    mutationFn: ({ confirmed, reason }) => api.verifyPayment(order.order_id, confirmed, reason),
    onSuccess: invalidate,
    onError: (err) => setActionError(err.response?.data?.detail || err.message),
  });
  const recheckMutation = useMutation({
    mutationFn: () => api.recheckGatewayPayment(order.order_id),
    onSuccess: invalidate,
    onError: (err) => setActionError(err.response?.data?.detail || err.message),
  });
  const startProcessingMutation = useMutation({
    mutationFn: () => api.startProcessing(order.order_id),
    onSuccess: invalidate,
    onError: (err) => setActionError(err.response?.data?.detail || err.message),
  });
  const markDeliveredMutation = useMutation({
    mutationFn: () => api.markDelivered(order.order_id),
    onSuccess: invalidate,
    onError: (err) => setActionError(err.response?.data?.detail || err.message),
  });
  const approveReturnMutation = useMutation({
    mutationFn: ({ approved, reason }) => api.approveReturn(order.order_id, approved, reason),
    onSuccess: invalidate,
    onError: (err) => setActionError(err.response?.data?.detail || err.message),
  });
  const cancelMutation = useMutation({
    mutationFn: () => api.cancelOrder(order.order_id, cancelReason),
    onSuccess: () => {
      invalidate();
      setCancelling(false);
      setCancelReason("");
    },
    onError: (err) => setActionError(err.response?.data?.detail || err.message),
  });

  const anyBusy =
    verifyMutation.isPending || recheckMutation.isPending || startProcessingMutation.isPending ||
    markDeliveredMutation.isPending || approveReturnMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-2">
      {(order.status === "pending_payment" || order.status === "proof_submitted") && order.payment_mode === "manual" && (
        <div className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-muted">Payment proof</span>
          <ConfirmRejectAction
            label="Confirm payment"
            busy={anyBusy}
            onConfirm={() => verifyMutation.mutate({ confirmed: true })}
            onReject={(reason) => verifyMutation.mutate({ confirmed: false, reason })}
          />
        </div>
      )}

      {order.status === "pending_payment" && order.payment_mode === "gateway" && (
        <div className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-muted">Gateway payment</span>
          <Button variant="secondary" className="!px-2.5 !py-1 !text-xs" onClick={() => recheckMutation.mutate()} disabled={anyBusy}>
            {recheckMutation.isPending ? "Checking…" : "Recheck payment status"}
          </Button>
        </div>
      )}

      {order.status === "payment_confirmed" && (
        <div className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-muted">Fulfillment</span>
          <Button className="!px-2.5 !py-1 !text-xs" onClick={() => startProcessingMutation.mutate()} disabled={anyBusy}>
            {startProcessingMutation.isPending ? "…" : "Start processing"}
          </Button>
        </div>
      )}

      {order.status === "processing" && (
        <div className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-muted">Fulfillment</span>
          <Button className="!px-2.5 !py-1 !text-xs" onClick={() => markDeliveredMutation.mutate()} disabled={anyBusy}>
            {markDeliveredMutation.isPending ? "…" : "Mark delivered"}
          </Button>
        </div>
      )}

      {order.status === "return_requested" && (
        <div className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-muted">Return request</span>
          <ConfirmRejectAction
            label="Approve return"
            busy={anyBusy}
            onConfirm={() => approveReturnMutation.mutate({ approved: true })}
            onReject={(reason) => approveReturnMutation.mutate({ approved: false, reason })}
          />
        </div>
      )}

      {CANCELLABLE_STATUSES.has(order.status) && (
        <div className="flex items-center gap-3 border-t border-line pt-2">
          <span className="w-32 shrink-0 text-xs text-muted">Cancel order</span>
          {!cancelling ? (
            <button onClick={() => setCancelling(true)} className="text-xs text-danger hover:underline">
              Cancel this order
            </button>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <input
                className="flex-1 rounded-[6px] border border-line px-2 py-1 text-xs"
                placeholder="Reason for cancelling"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <Button variant="danger" className="!px-2 !py-1 !text-xs" onClick={() => cancelMutation.mutate()} disabled={!cancelReason || anyBusy}>
                Confirm cancel
              </Button>
              <button onClick={() => setCancelling(false)} className="text-xs text-muted hover:text-ink">Never mind</button>
            </div>
          )}
        </div>
      )}

      {order.status === "awaiting_delivery_confirmation" && (
        <p className="text-xs text-muted">
          Waiting on the customer to confirm receipt (or the auto-timeout, per your scheduling settings) — no
          action needed unless they reach out separately.
        </p>
      )}
      {(order.status === "completed" || order.status === "cancelled" || order.status === "refunded") && (
        <p className="text-xs text-muted">No further action available — this order is closed out.</p>
      )}

      {actionError && <p className="text-xs text-danger">{actionError}</p>}
    </div>
  );
}

function OrderDetailPanel({ order }) {
  return (
    <div className="space-y-4 bg-paper p-4">
      <div>
        <div className="mb-1 text-xs font-medium text-muted">Items</div>
        <table className="w-full text-xs">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.item_id}>
                <td className="py-0.5 text-ink">{item.name}</td>
                <td className="py-0.5 text-muted">× {item.quantity}</td>
                <td className="py-0.5 text-right text-ink">₦{item.subtotal.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="border-t border-line font-medium">
              <td className="py-1 text-ink" colSpan={2}>Delivery fee</td>
              <td className="py-1 text-right text-ink">₦{order.delivery_fee.toLocaleString()}</td>
            </tr>
            <tr className="font-medium">
              <td className="py-1 text-ink" colSpan={2}>Total</td>
              <td className="py-1 text-right text-ink">₦{order.total_amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted">Delivery</div>
          <div className="text-ink">
            {order.delivery_method === "pickup" ? "Pickup" : order.delivery_address || order.delivery_location || "Delivery"}
          </div>
        </div>
        <div>
          <div className="text-muted">Payment</div>
          <div className="text-ink">
            {order.payment_mode === "manual" ? "Manual / bank transfer" : "Online gateway"}
          </div>
        </div>
        {order.payment_proof_url && (
          <div className="col-span-2">
            <div className="mb-1 text-muted">Payment proof</div>
            <a href={order.payment_proof_url} target="_blank" rel="noreferrer">
              <img src={order.payment_proof_url} alt="Payment proof" className="h-24 w-24 rounded-[8px] border border-line object-cover" />
            </a>
          </div>
        )}
        {order.payment_link && (
          <div className="col-span-2">
            <a href={order.payment_link} target="_blank" rel="noreferrer" className="text-accent-dark hover:underline">
              Checkout link →
            </a>
          </div>
        )}
        {order.cancellation_reason && (
          <div className="col-span-2">
            <div className="text-muted">Cancelled — reason</div>
            <div className="text-ink">{order.cancellation_reason}</div>
          </div>
        )}
        {order.return_reason && (
          <div className="col-span-2">
            <div className="text-muted">Return reason</div>
            <div className="text-ink">{order.return_reason}</div>
          </div>
        )}
      </div>

      <div className="border-t border-line pt-3">
        <div className="mb-2 text-xs font-medium text-muted">Actions</div>
        <OrderActions order={order} />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const countsQuery = useQuery({
    queryKey: ["order-status-counts"],
    queryFn: () => api.getOrderStatusCounts(),
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", statusFilter],
    queryFn: () => api.listOrders(statusFilter || undefined),
  });

  const chartData = Object.entries(ORDER_STATUS_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    color: meta.color,
    count: countsQuery.data?.[key] || 0,
  }));
  const totalOrders = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="max-w-5xl">
      <h1 className="mb-1 text-lg font-semibold text-ink">Orders</h1>
      <p className="mb-6 text-sm text-muted">{totalOrders} total order{totalOrders === 1 ? "" : "s"}</p>

      <div className="mb-6 rounded-[10px] border border-line bg-surface p-5">
        {countsQuery.isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : totalOrders === 0 ? (
          <EmptyState title="No orders yet" detail="Orders placed through WhatsApp will show up here." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-ink">All orders</div>
        <div className="w-56">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "", label: "All statuses" }, ...Object.entries(ORDER_STATUS_META).map(([value, m]) => ({ value, label: m.label }))]}
          />
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : ordersQuery.isError ? (
        <EmptyState title="Couldn't load orders" detail={ordersQuery.error?.message} />
      ) : ordersQuery.data.length === 0 ? (
        <EmptyState title="No orders match this filter" />
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper text-xs text-muted">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-2 py-2 text-left font-medium">Order</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Total</th>
                <th className="px-4 py-2 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.data.map((o) => {
                const isOpen = expandedId === o.order_id;
                return (
                  <Fragment key={o.order_id}>
                    <tr
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-paper"
                      onClick={() => setExpandedId(isOpen ? null : o.order_id)}
                    >
                      <td className="px-2 py-2 text-muted">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs text-muted">{o.order_id.slice(0, 8)}</td>
                      <td className="px-4 py-2"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-2 tabular">₦{o.total_amount?.toLocaleString?.() ?? o.total_amount}</td>
                      <td className="px-4 py-2 text-muted">{new Date(o.created_at).toLocaleString()}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <OrderDetailPanel order={o} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
