import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import EmptyState from "../components/EmptyState";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";

const KIND_META = {
  ai_escalation: { label: "Customer needs a person", color: "#B8590A" },
  payment_confirmation: { label: "Payment needs verifying", color: "#B3261E" },
  ready_to_process: { label: "Ready to start processing", color: "#2F6F5E" },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Needs attention" },
  { value: "acknowledged", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

function TranscriptView({ conversationId }) {
  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: () => api.getConversationMessages(conversationId),
  });

  if (messagesQuery.isLoading) return <p className="text-xs text-muted">Loading transcript…</p>;
  if (messagesQuery.isError) return <p className="text-xs text-danger">Couldn't load the transcript.</p>;
  if (messagesQuery.data.length === 0) return <p className="text-xs text-muted">No messages found.</p>;

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto rounded-[8px] bg-paper p-3">
      {messagesQuery.data.map((m) => (
        <div key={m.message_id} className={`flex ${m.role === "ai" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-[8px] px-2.5 py-1.5 text-xs ${
              m.role === "ai" ? "bg-accent-soft text-accent-dark" : "bg-surface text-ink"
            }`}
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
            <div className="mt-0.5 text-[10px] text-muted">{new Date(m.created_at).toLocaleTimeString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HandoffCard({ handoff }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const meta = KIND_META[handoff.kind] || { label: handoff.kind, color: "#5B6472" };

  const mutation = useMutation({
    mutationFn: (outcome) => api.acknowledgeHandoff(handoff.handoff_id, outcome),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["handoffs"] }),
    onError: (err) => setError(err.response?.data?.detail || err.message),
  });

  const isPending = handoff.status === "pending";
  // Confirmed/Rejected only means something distinct for the two kinds
  // tied to an order (see HandoffAcknowledge's own docstring) — for a
  // plain "customer wants a person" escalation, there's just one
  // meaningful action: mark it handled.
  const showConfirmReject = handoff.kind === "payment_confirmation" || handoff.kind === "ready_to_process";

  return (
    <div className="rounded-[10px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
          >
            {meta.label}
          </span>
          <p className="mt-2 text-sm text-ink">{handoff.summary || handoff.reason}</p>
          {handoff.customer_phone && (
            <p className="mt-1 text-xs text-muted">From {handoff.customer_phone}</p>
          )}
          <p className="mt-1 text-xs text-muted">{new Date(handoff.created_at).toLocaleString()}</p>
          {!isPending && (
            <p className="mt-1 text-xs text-muted">
              {handoff.status === "acknowledged" ? "Resolved" : "Rejected"} by {handoff.acknowledged_by} —{" "}
              {handoff.acknowledged_at && new Date(handoff.acknowledged_at).toLocaleString()}
            </p>
          )}
          {handoff.conversation_id && (
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="mt-1.5 text-xs text-accent-dark hover:underline"
            >
              {showTranscript ? "Hide conversation" : "View conversation →"}
            </button>
          )}
        </div>

        {isPending && (
          <div className="flex shrink-0 gap-2">
            {showConfirmReject ? (
              <>
                <Button className="!px-2.5 !py-1 !text-xs" onClick={() => mutation.mutate("confirmed")} disabled={mutation.isPending}>
                  Confirm
                </Button>
                <Button variant="secondary" className="!px-2.5 !py-1 !text-xs" onClick={() => mutation.mutate("rejected")} disabled={mutation.isPending}>
                  Reject
                </Button>
              </>
            ) : (
              <Button className="!px-2.5 !py-1 !text-xs" onClick={() => mutation.mutate("confirmed")} disabled={mutation.isPending}>
                {mutation.isPending ? "…" : "Mark handled"}
              </Button>
            )}
          </div>
        )}
      </div>
      {showTranscript && handoff.conversation_id && (
        <div className="mt-3 border-t border-line pt-3">
          <TranscriptView conversationId={handoff.conversation_id} />
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function HandoffsPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const handoffsQuery = useQuery({
    queryKey: ["handoffs", statusFilter],
    queryFn: () => api.listHandoffs(statusFilter || undefined),
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Needs attention</h1>
        <div className="w-48">
          <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        </div>
      </div>
      <p className="mb-6 text-sm text-muted">
        Conversations and orders where the AI stepped back and a person needs to act.
      </p>

      {handoffsQuery.isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : handoffsQuery.isError ? (
        <EmptyState title="Couldn't load handoffs" detail={handoffsQuery.error?.message} />
      ) : handoffsQuery.data.length === 0 ? (
        <EmptyState
          title={statusFilter === "pending" ? "Nothing needs attention right now" : "No handoffs here"}
        />
      ) : (
        <div className="space-y-3">
          {handoffsQuery.data.map((h) => (
            <HandoffCard key={h.handoff_id} handoff={h} />
          ))}
        </div>
      )}
    </div>
  );
}
