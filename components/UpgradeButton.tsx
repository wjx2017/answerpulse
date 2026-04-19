"use client";

import { useAuth } from "@/lib/use-auth";
import { PRO_PRICE_DISPLAY } from "@/lib/config";

interface UpgradeButtonProps {
  className?: string;
}

export default function UpgradeButton({ className = "" }: UpgradeButtonProps) {
  const paypalLink = process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK;

  // Fallback: PayPal link not configured → show disabled state
  if (!paypalLink || paypalLink === "#" || paypalLink.trim() === "") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gray-300 text-gray-500 font-semibold rounded-xl cursor-not-allowed ${className}`}
        title="PayPal payment link not configured yet. Please contact support."
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Upgrade Coming Soon
      </div>
    );
  }

  return (
    <a
      href={paypalLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 ${className}`}
      title="Pay directly via PayPal link. Pro activation may take up to 24 hours."
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      Pay via PayPal — ${PRO_PRICE_DISPLAY} · one-time
    </a>
  );
}
