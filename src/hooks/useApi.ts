// API hooks for backend readiness
// These are placeholder hooks that return simulation data for now.
// When a real backend is connected, swap the implementation.

import { useSimulationContext } from "@/contexts/SimulationContext";
import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api";

// Placeholder: returns simulation data directly
export function useSystemStatus() {
  const { world } = useSimulationContext();
  return useQuery({
    queryKey: ["system-status", world.tick],
    queryFn: async () => ({
      running: world.running,
      tick: world.tick,
      uptime: world.metrics.uptime,
      disruptions: world.disruptions,
    }),
    staleTime: 1000,
  });
}

export function useMetrics() {
  const { world } = useSimulationContext();
  return useQuery({
    queryKey: ["metrics", world.tick],
    queryFn: async () => world.metrics,
    staleTime: 1000,
  });
}

export function useEvents() {
  const { world } = useSimulationContext();
  return useQuery({
    queryKey: ["events", world.tick],
    queryFn: async () => world.events,
    staleTime: 1000,
  });
}

export function useDecisions() {
  const { world } = useSimulationContext();
  return useQuery({
    queryKey: ["decisions", world.tick],
    queryFn: async () => world.aiDecisions,
    staleTime: 1000,
  });
}

// Future: real API calls
// export function useSystemStatus() {
//   return useQuery({
//     queryKey: ["system-status"],
//     queryFn: () => fetch(`${API_BASE}/system-status`).then(r => r.json()),
//     refetchInterval: 2000,
//   });
// }
