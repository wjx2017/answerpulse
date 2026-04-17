import { AeoReport } from "./aeo-analyzer";

/**
 * Export report as PDF (client-side) using html2canvas + jsPDF.
 * Excludes the Pro upgrade card from the PDF output.
 */
export async function exportPdf(report: AeoReport) {
  const [html2canvas, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Hide Pro banner before screenshot
  const proBanner = document.querySelector('[data-role="pro-banner"]') as HTMLElement | null;
  const originalDisplay = proBanner?.style.display;
  if (proBanner) proBanner.style.display = "none";

  // Hide export buttons area before screenshot
  const exportBar = document.querySelector('[data-role="export-bar"]') as HTMLElement | null;
  const exportBarDisplay = exportBar?.style.display;
  if (exportBar) exportBar.style.display = "none";

  // Create a temporary CTA footer for the PDF
  const footerDiv = document.createElement("div");
  footerDiv.style.cssText =
    "background:linear-gradient(90deg,#4f46e5,#7c3aed);color:#fff;text-align:center;padding:16px;border-radius:12px;margin-top:24px;font-size:15px;font-weight:600;";
  footerDiv.innerHTML =
    '🔍 <span style="font-weight:400">Scan your own website → </span><a href="https://answerpulse.vercel.app" style="color:#fff;text-decoration:underline;">answerpulse.vercel.app</a>';

  const contentEl = document.getElementById("report-content");
  if (contentEl) contentEl.appendChild(footerDiv);

  try {
    const canvas = await html2canvas.default(contentEl || document.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f9fafb",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = 210; // A4 width mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfWidth, pdfHeight] });
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const urlSlug = report.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const dateStr = new Date(report.fetchTime).toISOString().split("T")[0];
    pdf.save(`answerpulse_${urlSlug}_${dateStr}.pdf`);
  } finally {
    // Restore Pro banner
    if (proBanner) proBanner.style.display = originalDisplay ?? "";
    if (exportBar) exportBar.style.display = exportBarDisplay ?? "";
    // Remove temporary footer
    if (footerDiv.parentNode) footerDiv.parentNode.removeChild(footerDiv);
  }
}

/**
 * Export report dimensions as CSV (client-side)
 */
export function exportCsv(report: AeoReport) {
  const statusLabels: Record<string, string> = {
    good: "Good",
    warning: "Warning",
    error: "Poor",
  };

  const headers = ["Dimension", "Weight", "Score", "MaxScore", "Status", "Recommendation"];
  const rows = report.dimensions.map((d) => [
    d.name,
    `${d.weight}%`,
    d.score,
    100,
    statusLabels[d.status] || d.status,
    d.recommendation || "No action needed",
  ]);

  // Summary row
  const totalStatus =
    report.totalScore >= 70 ? "Good" : report.totalScore >= 40 ? "Needs Improvement" : "Poor";
  rows.push(["Total AEO Score", "100%", report.totalScore, 100, totalStatus, ""]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const urlSlug = report.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  const dateStr = new Date(report.fetchTime).toISOString().split("T")[0];
  link.href = url;
  link.download = `answerpulse_${urlSlug}_${dateStr}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
