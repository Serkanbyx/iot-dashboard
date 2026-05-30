import { useState, useEffect } from "react";

/** Returns a verbose, auto-updating relative time string (e.g. "2 minutes ago"). */
export function useRelativeTime(timestamp: string, intervalMs = 1000): string {
  const [text, setText] = useState("");

  useEffect(() => {
    function update() {
      const diff = Math.floor(
        (Date.now() - new Date(timestamp).getTime()) / 1000
      );

      if (diff < 5) {
        setText("just now");
      } else if (diff < 60) {
        setText(`${diff} seconds ago`);
      } else if (diff < 3600) {
        const m = Math.floor(diff / 60);
        setText(`${m} minute${m === 1 ? "" : "s"} ago`);
      } else if (diff < 86400) {
        const h = Math.floor(diff / 3600);
        setText(`${h} hour${h === 1 ? "" : "s"} ago`);
      } else {
        const d = Math.floor(diff / 86400);
        setText(`${d} day${d === 1 ? "" : "s"} ago`);
      }
    }

    update();
    const interval = setInterval(update, intervalMs);
    return () => clearInterval(interval);
  }, [timestamp, intervalMs]);

  return text;
}
