import { toast } from "sonner";
import { getPrintHeaderHTML, getPrintWatermarkHTML } from "@/components/PrintHeader";
import { getPrintFooterHTML } from "@/components/PrintFooter";

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.join(","));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + (row[header] ?? "")).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadFileBlob(blob, `${filename}.csv`);
}

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

export async function exportToPDF(title: string, data: Record<string, any>[], columns: { key: string; label: string }[]) {
  if (data.length === 0) { toast.error("No data to export"); return; }
  
  toast.info("Generating PDF...");
  
  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
      h1 { font-size: 20px; margin-bottom: 20px; text-align: center; color: #1e293b; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
      th { background: #f8fafc; font-weight: bold; text-transform: uppercase; color: #64748b; }
    </style></head><body>
    ${getPrintHeaderHTML()}
    <h1>${title}</h1>
    <table>
      <thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
      <tbody>${data.map((row) => `<tr>${columns.map((c) => `<td>${row[c.key] ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    ${getPrintFooterHTML()}
    </body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1000px;height:2000px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);
  const iDoc = iframe.contentDocument!;
  iDoc.open(); iDoc.write(html); iDoc.close();

  await new Promise<void>(res => setTimeout(res, 1000)); // Wait for render

  const { toPng } = await import("html-to-image");
  const imgData = await toPng(iDoc.documentElement, { pixelRatio: 2, backgroundColor: "#ffffff" });
  
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  
  document.body.removeChild(iframe);
  toast.success("PDF exported successfully");
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
