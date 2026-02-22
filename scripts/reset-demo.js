/**
 * Reset demo state: clears simulation world, governance log, and retailer requests from localStorage.
 * Run in browser console from the app origin, or call window.__ARES_RESET_DEMO() if exposed.
 *
 * Usage (browser console):
 *   Copy-paste this file content and run, or:
 *   window.__ARES_RESET_DEMO?.()
 */

const KEYS = [
  "ares_world_state",
  "ares_governance_log",
  "sc_retailer_requests",
];

function resetDemo() {
  let cleared = 0;
  for (const key of KEYS) {
    try {
      if (typeof localStorage !== "undefined" && localStorage.getItem(key)) {
        localStorage.removeItem(key);
        cleared++;
      }
    } catch (e) {
      console.warn("reset-demo: could not remove", key, e);
    }
  }
  console.log("[ARES] Reset demo: cleared", cleared, "localStorage keys.", "Reload the page to see fresh state.");
  if (typeof window !== "undefined" && window.location) {
    window.location.reload();
  }
}

if (typeof window !== "undefined") {
  window.__ARES_RESET_DEMO = resetDemo;
}

resetDemo();
