import { toast } from "sonner";
import { getPrintHeaderHTML, getPrintWatermarkHTML } from "@/components/PrintHeader";
import { getPrintFooterHTML } from "@/components/PrintFooter";

export function exportToExcel(data: Record<string, any>[], filename: string) {
  if (data.length === 0) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  
  // Create a simple HTML table for Excel
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" /><style>
      table { border-collapse: collapse; }
      th { background-color: #f2f2f2; font-weight: bold; border: 1px solid #000; }
      td { border: 1px solid #000; }
    </style></head>
    <body><table><thead><tr>`;
  
  headers.forEach(h => {
    html += `<th>${h}</th>`;
  });
  
  html += `</tr></thead><tbody>`;
  
  data.forEach(row => {
    html += `<tr>`;
    headers.forEach(h => {
      const val = row[h] ?? "";
      html += `<td>${val}</td>`;
    });
    html += `</tr>`;
  });
  
  html += `</tbody></table></body></html>`;
  
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  downloadFileBlob(blob, `${filename}.xls`);
}

function downloadFileBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${filename}`);
}

export function exportToJSON(data: Record<string, any>[], filename: string) {
  if (data.length === 0) { toast.error("No data to export"); return; }
  downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, "application/json");
}

export function printTable(title: string, data: Record<string, any>[], columns: { key: string; label: string }[]) {
  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { font-size: 18px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f5f5f5; font-weight: 600; }
      @media print { body { padding: 0; } }
    </style></head><body>
    ${getPrintWatermarkHTML()}
    ${getPrintHeaderHTML()}
    <h1 style="text-align: center; margin-top: 20px;">${title}</h1>
    <table>
      <thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
      <tbody>${data.map((row) => `<tr>${columns.map((c) => `<td>${row[c.key] ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    ${getPrintFooterHTML()}
    </body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${filename}`);
}
