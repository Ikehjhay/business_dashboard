import axios from "axios";
import { getSettings } from "./settings";

// BUILDFEST DEMO BUILD -- no login, no auth token. get_current_tenant()
// on the backend now resolves the single demo tenant directly from
// DEMO_TENANT_ID, so every request here is implicitly scoped to it —
// no Authorization header needed.
function client() {
  return axios.create({
    baseURL: getSettings().apiBaseUrl,
    timeout: 15000,
  });
}

export const api = {
  // --- Catalog ---
  async listCatalogItems() {
    const { data } = await client().get("/catalog/items");
    return data;
  },
  async createCatalogItem(itemData) {
    // Backend takes a LIST (bulk-create endpoint, reused here for a
    // single item) — wrap in an array, unwrap the single result back out.
    const { data } = await client().post("/catalog/items", { items: [itemData] });
    return data[0];
  },
  async uploadCatalogCsv(file) {
    const form = new FormData();
    form.append("file", file);
    // No explicit Content-Type — same reason as uploadCatalogMedia
    // below: let the browser generate the multipart boundary itself.
    const { data } = await client().post("/catalog/items/csv", form);
    return data; // list of created items
  },
  async deleteCatalogItem(itemId) {
    await client().delete(`/catalog/items/${itemId}`);
  },
  async uploadCatalogMedia(itemId, file, caption) {
    const form = new FormData();
    form.append("file", file);
    if (caption) form.append("caption", caption);
    // No explicit Content-Type here on purpose — let axios/the browser
    // set it, so the multipart boundary gets generated correctly.
    // Setting "multipart/form-data" manually looks right but silently
    // breaks the request (no boundary param), a common gotcha.
    const { data } = await client().post(`/catalog/items/${itemId}/media`, form);
    return data;
  },
  async deleteCatalogMedia(itemId, mediaId) {
    const { data } = await client().delete(`/catalog/items/${itemId}/media/${mediaId}`);
    return data;
  },

  // --- Handoffs ---
  async listHandoffs(status) {
    const { data } = await client().get("/handoffs", { params: status ? { status } : {} });
    return data;
  },
  async acknowledgeHandoff(handoffId, outcome, acknowledgedBy = "Business owner (dashboard)") {
    const { data } = await client().post(`/handoffs/${handoffId}/acknowledge`, {
      acknowledged_by: acknowledgedBy,
      outcome,
    });
    return data;
  },

  // --- Orders ---
  async getOrderStatusCounts() {
    const { data } = await client().get("/orders/status-counts");
    return data;
  },
  async listOrders(status) {
    const { data } = await client().get("/orders", { params: status ? { status } : {} });
    return data;
  },
  async getOrder(orderId) {
    const { data } = await client().get(`/orders/${orderId}`);
    return data;
  },
  async verifyPayment(orderId, confirmed, rejectionReason) {
    const { data } = await client().post(`/orders/${orderId}/verify-payment`, {
      confirmed,
      verified_by: "Business owner (dashboard)",
      rejection_reason: rejectionReason || undefined,
    });
    return data;
  },
  async cancelOrder(orderId, reason) {
    const { data } = await client().post(`/orders/${orderId}/cancel`, { reason, cancelled_by: "owner" });
    return data;
  },
  async startProcessing(orderId) {
    const { data } = await client().post(`/orders/${orderId}/start-processing`);
    return data;
  },
  async recheckGatewayPayment(orderId) {
    const { data } = await client().post(`/orders/${orderId}/recheck-gateway-payment`);
    return data;
  },
  async markDelivered(orderId) {
    const { data } = await client().post(`/orders/${orderId}/mark-delivered`, { marked_by: "Business owner (dashboard)" });
    return data;
  },
  async approveReturn(orderId, approved, rejectionReason) {
    const { data } = await client().post(`/orders/${orderId}/approve-return`, {
      approved,
      reviewed_by: "Business owner (dashboard)",
      rejection_reason: rejectionReason || undefined,
    });
    return data;
  },

  // --- Conversations ---
  async getConversationMessages(conversationId, limit = 50) {
    const { data } = await client().get(`/conversations/${conversationId}/messages`, { params: { limit } });
    return data;
  },

  // --- Reporting (case-study "interaction record") ---
  async getMyBusinessOverview() {
    const { data } = await client().get("/analytics/me");
    return data;
  },

  // NOTE: persona/handoff-settings/scheduling-settings and payment-PIN
  // endpoints lived on the now-deleted onboarding.py router (tenant
  // self-service). Not needed for this demo -- Settings page was removed.
};
