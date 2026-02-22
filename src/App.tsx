import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteLayout } from "@/components/site/SiteLayout";
import DemoPage from "./pages/DemoPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import OverviewPage from "./pages/OverviewPage";
import MapPage from "./pages/MapPage";
import FleetPage from "./pages/FleetPage";
import InventoryPage from "./pages/InventoryPage";
import EventsPage from "./pages/EventsPage";
import AIBrainPage from "./pages/AIBrainPage";
import IssueDetailsPage from "./pages/IssueDetailsPage";
import CadburyProductsPage from "./pages/CadburyProductsPage";
import SupplierRequestsPage from "./pages/SupplierRequestsPage";
import LiveMapFeedPage from "./pages/LiveMapFeedPage";
import LoginPage from "./pages/LoginPage";
import ConsumerPortalLayout from "./pages/ConsumerPortalLayout";
import RetailerDashboardPage from "./pages/RetailerDashboardPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import ExecutiveDashboardPage from "./pages/ExecutiveDashboardPage";
import NetworkViewPage from "./pages/NetworkViewPage";
import SimulationLabPage from "./pages/SimulationLabPage";
import AgentMonitorPage from "./pages/AgentMonitorPage";
import ExplainabilityPage from "./pages/ExplainabilityPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import GovernanceLogsPage from "./pages/GovernanceLogsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SimulationProvider>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/ares" element={<Index />} />
                <Route path="/consumer" element={<ConsumerPortalLayout />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="executive" element={<ExecutiveDashboardPage />} />
                  <Route path="network" element={<NetworkViewPage />} />
                  <Route path="simulation-lab" element={<SimulationLabPage />} />
                  <Route path="agents" element={<AgentMonitorPage />} />
                  <Route path="explainability" element={<ExplainabilityPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="governance" element={<GovernanceLogsPage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="fleet" element={<FleetPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="products" element={<CadburyProductsPage />} />
                  <Route path="requests" element={<SupplierRequestsPage />} />
                  <Route path="live" element={<LiveMapFeedPage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="ai" element={<AIBrainPage />} />
                  <Route path="issue" element={<IssueDetailsPage />} />
                </Route>
                <Route path="/retailer" element={<RetailerDashboardPage />} />
                <Route path="/demo" element={<DemoPage />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="executive" element={<ExecutiveDashboardPage />} />
                  <Route path="network" element={<NetworkViewPage />} />
                  <Route path="simulation-lab" element={<SimulationLabPage />} />
                  <Route path="agents" element={<AgentMonitorPage />} />
                  <Route path="explainability" element={<ExplainabilityPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="governance" element={<GovernanceLogsPage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="fleet" element={<FleetPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="cadbury" element={<CadburyProductsPage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="ai" element={<AIBrainPage />} />
                  <Route path="issue" element={<IssueDetailsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SimulationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
