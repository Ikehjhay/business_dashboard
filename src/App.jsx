import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardHomePage from "./pages/DashboardHomePage";
import OrdersPage from "./pages/OrdersPage";
import CatalogPage from "./pages/CatalogPage";
import HandoffsPage from "./pages/HandoffsPage";
import LoginPage from "./pages/LoginPage";
import { isLoggedIn } from "./lib/demoAuth";

// BUILDFEST DEMO BUILD -- login is a client-side-only gate (see
// lib/demoAuth.js), not real auth. The backend still pins every API
// request to one seeded tenant regardless of this -- this just hides
// the dashboard UI behind a phone/password screen for the demo.
function RequireLogin({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireLogin>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<DashboardHomePage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/handoffs" element={<HandoffsPage />} />
                </Routes>
              </DashboardLayout>
            </RequireLogin>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
