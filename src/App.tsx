import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimulationProvider } from "@/contexts/SimulationContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SimulationProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/demo" element={<DemoPage />}>
                <Route index element={<OverviewPage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="fleet" element={<FleetPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="ai" element={<AIBrainPage />} />
                <Route path="issue" element={<IssueDetailsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SimulationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
