import type { AggregatedReading, SensorTypeValue } from "../types";

export interface ExportMeta {
  sensorId: string;
  sensorType: SensorTypeValue;
  unit: string;
  window: "minute" | "hour";
  start: string;
  stop: string;
}

const CSV_HEADERS = [
  "Bucket",
  "Average",
  "Minimum",
  "Maximum",
  "Reading Count",
] as const;

function formatBucket(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function buildFileName(meta: ExportMeta, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${meta.sensorId}_${meta.sensorType}_${stamp}.${extension}`;
}

function escapeCsvCell(value: string | number): string {
  const cell = String(value);
  return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCsv(
  data: AggregatedReading[],
  meta: ExportMeta
): void {
  const rows = data.map((reading) =>
    [
      reading.bucket,
      reading.avgValue.toFixed(2),
      reading.minValue.toFixed(2),
      reading.maxValue.toFixed(2),
      reading.readingCount,
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  const csv = [CSV_HEADERS.join(","), ...rows].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, buildFileName(meta, "csv"));
}

function computeStats(data: AggregatedReading[], unit: string) {
  if (data.length === 0) {
    return { min: "—", max: "—", avg: "—", count: 0 };
  }
  const avgValues = data.map((d) => d.avgValue);
  const min = Math.min(...avgValues);
  const max = Math.max(...avgValues);
  const avg = avgValues.reduce((sum, v) => sum + v, 0) / avgValues.length;
  return {
    min: `${min.toFixed(1)}${unit}`,
    max: `${max.toFixed(1)}${unit}`,
    avg: `${avg.toFixed(1)}${unit}`,
    count: data.length,
  };
}

export function exportToPdf(
  data: AggregatedReading[],
  meta: ExportMeta
): boolean {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return false;

  const stats = computeStats(data, meta.unit);
  const typeLabel =
    meta.sensorType.charAt(0).toUpperCase() + meta.sensorType.slice(1);

  const rowsHtml = data
    .map(
      (reading) => `
        <tr>
          <td>${formatBucket(reading.bucket)}</td>
          <td>${reading.avgValue.toFixed(2)}${meta.unit}</td>
          <td>${reading.minValue.toFixed(2)}${meta.unit}</td>
          <td>${reading.maxValue.toFixed(2)}${meta.unit}</td>
          <td>${reading.readingCount}</td>
        </tr>`
    )
    .join("");

  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${meta.sensorId} — ${typeLabel} Report</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .subtitle { color: #64748b; font-size: 13px; margin: 0 0 24px; }
  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 32px; margin-bottom: 24px; font-size: 13px; }
  .meta span { color: #64748b; }
  .stats { display: flex; gap: 16px; margin-bottom: 24px; }
  .stat { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
  .stat .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
  .stat .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; }
  tbody td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <h1>IoT Sensor Report</h1>
  <p class="subtitle">Generated ${new Date().toLocaleString()}</p>

  <div class="meta">
    <div><span>Sensor:</span> <strong>${meta.sensorId}</strong></div>
    <div><span>Type:</span> <strong>${typeLabel}</strong></div>
    <div><span>Window:</span> <strong>${meta.window}</strong></div>
    <div><span>Range:</span> <strong>${formatBucket(meta.start)} → ${formatBucket(meta.stop)}</strong></div>
  </div>

  <div class="stats">
    <div class="stat"><div class="label">Minimum</div><div class="value">${stats.min}</div></div>
    <div class="stat"><div class="label">Maximum</div><div class="value">${stats.max}</div></div>
    <div class="stat"><div class="label">Average</div><div class="value">${stats.avg}</div></div>
    <div class="stat"><div class="label">Data Points</div><div class="value">${stats.count}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Bucket</th><th>Average</th><th>Minimum</th><th>Maximum</th><th>Readings</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <footer>IoT Dashboard — serkanbayraktar.com</footer>
</body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
  return true;
}
