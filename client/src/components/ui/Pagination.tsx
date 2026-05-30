import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type PageToken = number | "ellipsis";

/** Build a compact page list: first, last, and 2 around current with ellipsis. */
function buildPages(page: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PageToken[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}

const buttonClass = cn(
  "flex items-center justify-center h-9 min-w-9 px-3 rounded-lg text-sm font-medium",
  "glass transition-colors duration-150",
  "disabled:opacity-40 disabled:pointer-events-none"
);

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(buttonClass, "text-text-secondary hover:text-text-primary")}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-1">
        {pages.map((token, index) =>
          token === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1.5 text-text-muted text-sm select-none"
            >
              …
            </span>
          ) : (
            <button
              key={token}
              type="button"
              onClick={() => onPageChange(token)}
              className={cn(
                buttonClass,
                token === page
                  ? "bg-accent-blue text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
              aria-current={token === page ? "page" : undefined}
            >
              {token}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(buttonClass, "text-text-secondary hover:text-text-primary")}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>

      <span className="ml-2 text-xs text-text-muted">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
