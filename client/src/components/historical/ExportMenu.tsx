import { useState, useRef, useEffect, useCallback } from "react";
import { Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import type { AggregatedReading } from "../../types";
import { exportToCsv, exportToPdf, type ExportMeta } from "../../utils/exportData";
import { cn } from "../../utils/cn";

interface ExportMenuProps {
  data: AggregatedReading[];
  meta: ExportMeta;
}

export default function ExportMenu({ data, meta }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const disabled = data.length === 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleCsv = useCallback(() => {
    setOpen(false);
    exportToCsv(data, meta);
    toast.success("CSV exported");
  }, [data, meta]);

  const handlePdf = useCallback(() => {
    setOpen(false);
    const ok = exportToPdf(data, meta);
    if (!ok) {
      toast.error("Pop-up blocked — allow pop-ups to export PDF.");
    }
  }, [data, meta]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium",
          "bg-bg-elevated border border-glass-border text-text-secondary",
          "transition-colors duration-150 hover:text-text-primary hover:bg-bg-card-hover",
          "disabled:opacity-50 disabled:pointer-events-none focus-ring"
        )}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Download size={16} />
        Export
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-44 z-50",
            "glass rounded-xl border border-glass-border shadow-lg py-1.5"
          )}
        >
          <MenuItem icon={FileSpreadsheet} label="Export as CSV" onClick={handleCsv} />
          <MenuItem icon={FileText} label="Export as PDF" onClick={handlePdf} />
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
}

function MenuItem({ icon: Icon, label, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 w-full px-4 py-2 text-sm",
        "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover",
        "transition-colors duration-150"
      )}
    >
      <Icon size={16} className="text-accent-blue" />
      {label}
    </button>
  );
}
