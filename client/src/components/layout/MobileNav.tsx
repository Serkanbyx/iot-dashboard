import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Bell, Cpu, Sliders } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../utils/cn";

interface MobileNavItem {
  labelKey: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: MobileNavItem[] = [
  { labelKey: "nav.dashboard", icon: LayoutDashboard, path: "/" },
  { labelKey: "nav.historical", icon: TrendingUp, path: "/historical" },
  { labelKey: "nav.alerts", icon: Bell, path: "/alerts" },
  { labelKey: "nav.devices", icon: Cpu, path: "/devices", adminOnly: true },
  { labelKey: "nav.settings", icon: Sliders, path: "/settings", adminOnly: true },
];

export default function MobileNav() {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function handleResize() {
      const threshold = window.innerHeight * 0.75;
      setKeyboardOpen((vv?.height ?? window.innerHeight) < threshold);
    }

    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  if (keyboardOpen) return null;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 h-16",
        "glass border-t border-glass-border",
        "flex items-center justify-around",
        "md:hidden"
      )}
    >
      {visibleItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 focus-ring",
              "w-full h-full",
              "transition-colors duration-150",
              isActive
                ? "text-accent-blue"
                : "text-text-muted hover:text-text-secondary"
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={22} />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              {isActive && (
                <span className="absolute bottom-2 h-1 w-1 rounded-full bg-accent-blue" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
