import { useCallback, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  Sliders,
  Cpu,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useConnectionStatus } from "../../hooks/useConnectionStatus";
import LiveIndicator from "../dashboard/LiveIndicator";
import { cn } from "../../utils/cn";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Historical", icon: TrendingUp, path: "/historical" },
  { label: "Alerts", icon: Bell, path: "/alerts" },
  { label: "Devices", icon: Cpu, path: "/devices", adminOnly: true },
  { label: "Settings", icon: Sliders, path: "/settings", adminOnly: true },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();
  const { indicatorStatus } = useConnectionStatus();
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isWide = expanded || hovered;

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  const connectionStatus = indicatorStatus;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "hidden md:flex fixed top-16 left-0 bottom-0 z-40",
          "flex-col bg-bg-secondary border-r border-glass-border sidebar-shadow",
          "transition-[width] duration-300 ease-in-out overflow-hidden"
        )}
        style={{ width: isWide ? 240 : 72 }}
      >
        <nav className="flex-1 flex flex-col gap-1 py-4 px-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg focus-ring",
                  "transition-all duration-150 relative",
                  isActive
                    ? "text-accent-blue bg-accent-blue/10 shadow-[inset_3px_0_0_0_var(--color-accent-blue)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
                )
              }
            >
              <item.icon size={22} />
              <span
                className={cn(
                  "whitespace-nowrap text-sm font-medium",
                  "transition-opacity duration-200",
                  isWide ? "opacity-100" : "opacity-0 w-0"
                )}
              >
                {item.label}
              </span>

              {/* Tooltip when collapsed */}
              {!isWide && (
                <span
                  className={cn(
                    "absolute left-full ml-2 px-2.5 py-1 rounded-md text-xs font-medium",
                    "bg-bg-elevated text-text-primary shadow-lg",
                    "opacity-0 group-hover:opacity-100 pointer-events-none",
                    "transition-opacity duration-150 whitespace-nowrap z-50"
                  )}
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: collapse toggle + version */}
        <div className="px-2 pb-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleExpand}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg w-full focus-ring",
              "text-text-muted hover:text-text-secondary hover:bg-bg-card-hover",
              "transition-colors duration-150"
            )}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            <span
              className={cn(
                "text-xs whitespace-nowrap transition-opacity duration-200",
                isWide ? "opacity-100" : "opacity-0 w-0"
              )}
            >
              Collapse
            </span>
          </button>
          {isWide && (
            <span className="text-[10px] text-text-muted text-center">
              v1.0.0
            </span>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className={cn(
                "fixed top-0 left-0 bottom-0 z-50 w-[280px]",
                "flex flex-col bg-bg-secondary border-r border-glass-border",
                "md:hidden"
              )}
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-glass-border">
                <div className="flex items-center gap-2.5">
                  <LiveIndicator status={connectionStatus} />
                  <span className="text-lg font-semibold tracking-tight">
                    IoT Dashboard
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors focus-ring"
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile nav */}
              <nav className="flex-1 flex flex-col gap-1 py-4 px-3">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg focus-ring",
                        "transition-all duration-150",
                        isActive
                          ? "text-accent-blue bg-accent-blue/10 shadow-[inset_3px_0_0_0_var(--color-accent-blue)]"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
                      )
                    }
                  >
                    <item.icon size={22} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="px-4 pb-6">
                <span className="text-[10px] text-text-muted">v1.0.0</span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
