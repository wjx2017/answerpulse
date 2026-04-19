"use client";

interface UpgradeButtonProps {
  className?: string;
}

export default function UpgradeButton({ className = "" }: UpgradeButtonProps) {
  const paypalLink = process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK;

  // Fallback: PayPal link not configured → show disabled state
  if (!paypalLink || paypalLink === "#" || paypalLink.trim() === "") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-sm text-gray-400 cursor-not-allowed ${className}`}
        title="PayPal payment link not configured yet. Please contact support."
      >
        Fallback link not available
      </span>
    );
  }

  return (
    <a
      href={paypalLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className}`}
      title="Fallback PayPal payment link. Pro activation may take up to 24 hours."
    >
      Having trouble? Use the fallback PayPal link →
    </a>
  );
}
