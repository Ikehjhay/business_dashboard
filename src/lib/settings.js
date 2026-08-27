// BUILDFEST DEMO BUILD -- SettingsPage.jsx (the only place that called
// saveSettings) was removed along with the onboarding endpoints it
// depended on. Configure the API URL via .env instead: create
// business_dashboard/.env with VITE_API_BASE_URL=<your api url>, or just
// edit the fallback below directly for a quick local run.
export function getSettings() {
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  };
}
