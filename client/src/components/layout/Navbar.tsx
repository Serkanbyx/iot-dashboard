import { Menu } from "lucide-react";
import { cn } from "../../utils/cn";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
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
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emerald opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-emerald" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            IoT Dashboard
          </span>
        </div>
      </div>

      {/* Center + Right sections will be implemented in Step 18 */}
      <div className="flex items-center gap-2" />
    </header>
  );
}
