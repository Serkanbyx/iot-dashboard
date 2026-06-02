import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
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
          "pb-16 md:pb-0",
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

        {/* Footer */}
        <footer className="hidden md:flex items-center justify-center py-3 text-xs text-text-muted">
          Created by{" "}
          <a
            href="https://serkanbayraktar.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-accent-blue hover:text-accent-blue/80 transition-colors"
          >
            Serkanby
          </a>
          <span className="mx-1.5">|</span>
          <a
            href="https://github.com/Serkanbyx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue hover:text-accent-blue/80 transition-colors"
          >
            Github
          </a>
        </footer>
      </main>

      <MobileNav />
    </div>
  );
}
