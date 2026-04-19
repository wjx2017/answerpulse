"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PRO_PRICE } from "@/lib/config";

interface PayPalButtonProps {
  className?: string;
}

export default function PayPalButton({ className = "" }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // If PayPal client ID not configured, don't render
  if (!paypalClientId) {
    return null;
  }

  const handleCreateOrder = useCallback(async (): Promise<string> => {
    setProcessing(true);
    setError(null);
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error("Please sign in to upgrade");
      }
      throw new Error(body.error || "Failed to create order");
    }
    const data = await res.json();
    return data.orderID;
  }, []);

  const handleApprove = useCallback(
    async (data: { orderID: string }) => {
      setProcessing(true);
      setError(null);
      try {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID: data.orderID }),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Payment capture failed");
        }
        // Payment succeeded — stop spinner and show success
        setProcessing(false);
        setSuccess(true);
        // Notify all useAuth instances to refresh profile
        window.dispatchEvent(new CustomEvent("answerpulse:profile-refresh"));
      } catch (err: any) {
        setError(err.message || "Payment failed");
        setProcessing(false);
      }
    },
    [handleCreateOrder]
  );

  useEffect(() => {
    let cancelled = false;
    let refPoll: ReturnType<typeof setInterval> | null = null;

    const renderButtons = async () => {
      if (cancelled) return;
      if (!window.paypal?.Buttons) return;

      if (!containerRef.current) {
        if (!refPoll) {
          refPoll = setInterval(() => {
            if (containerRef.current && window.paypal?.Buttons) {
              if (refPoll) clearInterval(refPoll);
              refPoll = null;
              void renderButtons();
            }
          }, 100);
          setTimeout(() => {
            if (refPoll) {
              clearInterval(refPoll);
              refPoll = null;
              if (!containerRef.current) {
                setError("Failed to mount payment buttons");
                setLoading(false);
              }
            }
          }, 5000);
        }
        return;
      }

      if (containerRef.current.childElementCount > 0) {
        setLoading(false);
        return;
      }

      try {
        await window.paypal
          .Buttons({
            style: {
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "pay",
            },
            createOrder: handleCreateOrder,
            onApprove: handleApprove,
            onError: (err: Error) => {
              console.error("PayPal error:", err);
              setError(err.message || "Payment error occurred");
              setProcessing(false);
            },
            onCancel: () => {
              setProcessing(false);
            },
          })
          .render(containerRef.current);
        if (!cancelled) setLoading(false);
      } catch (err: any) {
        console.error("Failed to render PayPal buttons:", err);
        if (!cancelled) {
          setError("Failed to load payment buttons");
          setLoading(false);
        }
      }
    };

    // Load PayPal SDK dynamically
    const existingScript = document.querySelector('script[src*="sdk/js"]');
    if (existingScript) {
      if (window.paypal?.Buttons) {
        void renderButtons();
        return () => {
          cancelled = true;
          if (refPoll) clearInterval(refPoll);
        };
      }

      const poll = setInterval(() => {
        if (window.paypal?.Buttons) {
          clearInterval(poll);
          void renderButtons();
        }
      }, 100);
      const timeout = setTimeout(() => {
        clearInterval(poll);
        if (!window.paypal?.Buttons) {
          setError("PayPal SDK failed to load");
          setLoading(false);
        }
      }, 10000);

      return () => {
        cancelled = true;
        clearInterval(poll);
        clearTimeout(timeout);
        if (refPoll) clearInterval(refPoll);
      };
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => {
      void renderButtons();
    };
    script.onerror = () => {
      setError("Failed to load PayPal. Check your connection.");
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (refPoll) clearInterval(refPoll);
    };
  }, [paypalClientId, handleCreateOrder, handleApprove]);

  if (success) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm text-green-600 mb-1">✅ Payment successful!</p>
        <p className="text-sm text-green-600 mb-3">Pro access activated for 30 days.</p>
        <a
          href="/"
          className="text-sm text-pulse-600 hover:underline"
        >
          Go to Dashboard →
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm text-red-500 mb-3">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setSuccess(false);
            setLoading(true);
            // Remove existing script to force reload
            const s = document.querySelector('script[src*="sdk/js"]');
            s?.remove();
            delete (window as any).paypal;
          }}
          className="text-sm text-pulse-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {(loading || processing) && (
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">
            {processing ? "Processing payment…" : "Loading PayPal…"}
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className={loading || processing ? "pointer-events-none opacity-0 h-0 overflow-hidden" : ""}
      />
    </div>
  );
}
