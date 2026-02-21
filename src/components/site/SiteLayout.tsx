import { Outlet } from "react-router-dom";
import { SiteNavbar } from "./SiteNavbar";

export function SiteLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
