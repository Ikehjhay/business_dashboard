export const HANDOFF_METHOD_OPTIONS = [
  { value: "dashboard", label: "Dashboard only" },
  { value: "email", label: "Email" },
  { value: "slack", label: "Slack" },
  { value: "sms", label: "SMS" },
];

export const PAYMENT_MODE_OPTIONS = [
  { value: "manual", label: "Manual — bank transfer, you confirm proof" },
  { value: "gateway", label: "Gateway — Paystack/Flutterwave checkout link" },
  { value: "both", label: "Both — customer's choice" },
];

export const PAYMENT_PROVIDER_OPTIONS = [
  { value: "paystack", label: "Paystack" },
  { value: "flutterwave", label: "Flutterwave" },
];

export const PERSONA_TONE_OPTIONS = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
];

// Order status colors for the dashboard/orders chart — matches
// app/models.py's OrderStatus Literal exactly.
export const ORDER_STATUS_META = {
  pending_payment: { label: "Pending payment", color: "#B8590A" },
  proof_submitted: { label: "Proof submitted", color: "#B8590A" },
  payment_confirmed: { label: "Payment confirmed", color: "#2F6F5E" },
  processing: { label: "Processing", color: "#2F6F5E" },
  awaiting_delivery_confirmation: { label: "Awaiting confirmation", color: "#B8590A" },
  completed: { label: "Completed", color: "#1F4E41" },
  cancelled: { label: "Cancelled", color: "#B3261E" },
  return_requested: { label: "Return requested", color: "#B3261E" },
  refunded: { label: "Refunded", color: "#5B6472" },
};
