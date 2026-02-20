import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { AresLayout } from "@/components/ares/AresLayout";
import OverviewPage from "./pages/OverviewPage";
import MapPage from "./pages/MapPage";
import FleetPage from "./pages/FleetPage";
import InventoryPage from "./pages/InventoryPage";
import EventsPage from "./pages/EventsPage";
import AIBrainPage from "./pages/AIBrainPage";
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
            <Route element={<AresLayout />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/fleet" element={<FleetPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/ai" element={<AIBrainPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SimulationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
