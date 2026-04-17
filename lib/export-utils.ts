import { AeoReport, DimensionResult } from "./aeo-analyzer";

/**
 * Export report as PDF using html2canvas + jsPDF (client-side only)
 */
export async function exportPdf(report: AeoReport, containerId: string = "report-content") {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  const element = document.getElementById(containerId);
  if (!element) throw new Error("Report container not found");

  // Temporarily show any hidden recommendations for complete PDF
  const expandButtons = element.querySelectorAll("button");
  expandButtons.forEach((btn) => {
    if (btn.textContent?.includes("View suggestion")) {
      (btn as HTMLButtonElement).click();
    }
  });

  // Small delay for DOM update
  await new Promise((r) => setTimeout(r, 300));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f9fafb",
    logging: false,
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  let heightLeft = imgHeight;
  let position = margin;

  // First page
  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  // Additional pages
  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  // Add CTA banner on last page with clickable link
  const lastPage = (pdf as any).internal.getNumberOfPages();
  pdf.setPage(lastPage);
  const bannerHeight = 14;
  const bannerY = pageHeight - margin - bannerHeight;

  // Banner background
  pdf.setFillColor(79, 70, 229); // pulse-600 / indigo
  pdf.roundedRect(margin, bannerY, contentWidth, bannerHeight, 3, 3, "F");

  // CTA text in white
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  const ctaText = "Scan your own website";
  const ctaWidth = pdf.getTextWidth(ctaText);
  pdf.text(ctaText, margin + 8, bannerY + bannerHeight / 2 + 3);

  // Arrow
  const arrowX = margin + 8 + ctaWidth + 2;
  pdf.text("\u2192", arrowX, bannerY + bannerHeight / 2 + 3);

  // URL text
  const urlText = "answerpulse.vercel.app";
  const urlWidth = pdf.getTextWidth(urlText);
  const urlX = arrowX + 6;
  pdf.text(urlText, urlX, bannerY + bannerHeight / 2 + 3);

  // Make the entire banner area clickable
  pdf.link(margin, bannerY, contentWidth, bannerHeight, { url: "https://answerpulse.vercel.app" });

  // Add brand header to each page
  for (let i = 1; i <= lastPage; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(79, 70, 229); // pulse-600
    pdf.text("AnswerPulse AEO Report", margin, margin - 2);
    pdf.setFontSize(7);
    pdf.setTextColor(156, 163, 175);
    pdf.text(report.url.substring(0, 80) + (report.url.length > 80 ? "…" : ""), margin, margin + 3);
  }

  // Generate filename from URL
  const urlSlug = report.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  const dateStr = new Date(report.fetchTime).toISOString().split("T")[0];
  pdf.save(`answerpulse_${urlSlug}_${dateStr}.pdf`);
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
