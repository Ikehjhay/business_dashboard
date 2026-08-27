import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardHomePage from "./pages/DashboardHomePage";
import OrdersPage from "./pages/OrdersPage";
import CatalogPage from "./pages/CatalogPage";
import HandoffsPage from "./pages/HandoffsPage";

// BUILDFEST DEMO BUILD -- no login gate. The backend pins every request
// to one seeded tenant (see ai_platform_api/scripts/seed_demo_tenant.py),
// so the dashboard opens straight to the home page.
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-paper">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<DashboardHomePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/handoffs" element={<HandoffsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
