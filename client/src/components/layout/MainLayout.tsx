import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { cn } from "../../utils/cn";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar onMenuToggle={handleMenuToggle} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Main content area */}
      <main
        className={cn(
          "pt-16 min-h-screen",
          "ml-0 md:ml-[72px]",
          "transition-[margin] duration-300 ease-in-out"
        )}
      >
        <div
          className="relative min-h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-6"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(59, 130, 246, 0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
