import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnswerPulse — AEO Scanner",
  description:
    "Check your page's AEO score instantly. Analyze structured data, Q&A format, readability, and 8 key dimensions for answer engine visibility. Fast, no signup required.",
  keywords: [
    "AEO",
    "Answer Engine Optimization",
    "SEO tool",
    "structured data",
    "schema markup",
    "FAQ schema",
    "AI search optimization",
  ],
  openGraph: {
    title: "AnswerPulse — AEO Scanner",
    description: "Analyze your page's AEO score across 8 dimensions in seconds.",
    type: "website",
    url: "https://answerpulse.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "AnswerPulse — AEO Scanner",
    description: "Analyze your page's AEO score across 8 dimensions in seconds.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
