import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface FloorTab {
  id: string;
  label: string;
  count: number;
}

interface FloorTabsProps {
  tabs: FloorTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function FloorTabs({
  tabs,
  activeTab,
  onTabChange,
}: FloorTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl p-1 glass w-fit">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-4 py-2 rounded-lg text-sm font-medium",
              "transition-colors duration-150 z-10",
              isActive
                ? "text-white"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="floor-tab-indicator"
                className="absolute inset-0 rounded-lg bg-accent-blue glow-blue"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {tab.label}
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-bg-elevated text-text-muted"
                )}
              >
                {tab.count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
