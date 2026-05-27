import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSocketContext } from "../../contexts/SocketContext";
import { useTheme } from "../../contexts/ThemeContext";
import LiveIndicator from "../dashboard/LiveIndicator";
import { cn } from "../../utils/cn";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const { isConnected } = useSocketContext();
  const { isDark, setTheme, theme } = useTheme();
  const navigate = useNavigate();

  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Trigger shake when count increases
  useEffect(() => {
    if (unacknowledgedCount > prevCountRef.current) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unacknowledgedCount;
  }, [unacknowledgedCount]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleThemeToggle = useCallback(() => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  }, [theme, setTheme]);

  const handleLogout = useCallback(() => {
    setDropdownOpen(false);
    logout();
  }, [logout]);

  const connectionStatus = isConnected ? "online" : "offline";

  /* Expose setter for alert badge — parent/socket can update via ref or context */
  // Will be wired to real socket events in a later step
  void setUnacknowledgedCount;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16",
        "glass border-b border-glass-border",
        "flex items-center justify-between px-4"
      )}
    >
      {/* Left: hamburger (mobile) + logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className={cn(
            "md:hidden p-2 rounded-lg",
            "text-text-secondary hover:text-text-primary",
            "hover:bg-bg-card-hover transition-colors duration-150"
          )}
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2.5">
          <LiveIndicator status={connectionStatus} />
          <span className="text-lg font-semibold tracking-tight">
            IoT Dashboard
          </span>
        </div>
      </div>

      {/* Center: connection status pill */}
      <div className="hidden sm:flex items-center">
        <ConnectionPill isConnected={isConnected} />
      </div>

      {/* Right: bell + theme + user */}
      <div className="flex items-center gap-1">
        {/* Alert bell */}
        <button
          type="button"
          onClick={() => navigate("/alerts")}
          className={cn(
            "relative p-2 rounded-lg",
            "text-text-secondary hover:text-text-primary",
            "hover:bg-bg-card-hover transition-colors duration-150",
            shaking && "animate-shake"
          )}
          aria-label={`Alerts${unacknowledgedCount > 0 ? `, ${unacknowledgedCount} unacknowledged` : ""}`}
        >
          <Bell size={20} />
          {unacknowledgedCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                "min-w-5 h-5 px-1 rounded-full",
                "bg-danger text-white text-xs font-bold"
              )}
            >
              {unacknowledgedCount > 99 ? "99+" : unacknowledgedCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className={cn(
            "p-2 rounded-lg",
            "text-text-secondary hover:text-text-primary",
            "hover:bg-bg-card-hover transition-colors duration-150"
          )}
          aria-label={`Switch theme (current: ${theme})`}
        >
          <span
            className="inline-block transition-transform duration-300"
            style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
          >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
          </span>
        </button>

        {/* User menu */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg",
              "text-text-secondary hover:text-text-primary",
              "hover:bg-bg-card-hover transition-colors duration-150"
            )}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                "bg-accent-blue/20 text-accent-blue text-sm font-semibold"
              )}
            >
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </span>
            <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
              {user?.name ?? "User"}
            </span>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              className={cn(
                "absolute right-0 top-full mt-2 w-56",
                "glass rounded-xl border border-glass-border",
                "shadow-lg py-2 z-50"
              )}
            >
              <div className="px-4 py-2 border-b border-glass-border">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-muted truncate">
                    {user?.email}
                  </span>
                  <RoleBadge role={user?.role} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-2 w-full px-4 py-2 mt-1",
                  "text-sm text-text-secondary",
                  "hover:text-danger hover:bg-danger/10",
                  "transition-colors duration-150"
                )}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function ConnectionPill({ isConnected }: { isConnected: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full",
        "glass text-xs font-medium",
        isConnected && "glow-emerald"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isConnected ? "bg-accent-emerald" : "bg-danger",
          !isConnected && "animate-pulse"
        )}
      />
      <span
        className={cn(
          isConnected ? "text-accent-emerald" : "text-danger"
        )}
      >
        {isConnected ? "Live" : "Offline"}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role?: "ADMIN" | "VIEWER" }) {
  if (!role) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
        role === "ADMIN"
          ? "bg-accent-violet/20 text-accent-violet"
          : "bg-accent-blue/20 text-accent-blue"
      )}
    >
      {role}
    </span>
  );
}
