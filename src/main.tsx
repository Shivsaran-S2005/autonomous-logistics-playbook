import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDb } from "./data/db";

// Render immediately; init DB in background (Supabase fetch). Never block the UI.
createRoot(document.getElementById("root")!).render(<App />);
initDb().catch((err) => console.warn("[initDb]", err));
