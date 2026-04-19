import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pages";
import { PRO_PRICE } from "@/lib/config";

/**
 * POST /api/paypal/capture-order
 *
 * Captures a PayPal order after user approval and upgrades the user to Pro.
 * 
 * Flow:
 * 1. Verify user is authenticated
 * 2. Verify order exists and belongs to us (amount + currency match)
 * 3. Capture the payment
 * 4. Upgrade user: plan='pro', reset scans
 *
 * Idempotency: safe to call multiple times — already-captured orders
 * return 409 from PayPal, and already-Pro users are idempotent.
 *
 * Body: { orderID: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderID } = req.body as { orderID?: string };
  if (!orderID) {
    return res.status(400).json({ error: "orderID is required" });
  }

  // ── Auth ──
  const supabase = createPagesServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Please sign in" });
  }

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const paypalBaseUrl = process.env.NEXT_PUBLIC_PAYPAL_API_URL || "https://api-m.paypal.com";

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Payment not configured" });
  }

  const auth = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

  // ── Step 1: Show order details to verify amount & currency ──
  let orderDetails: any;
  try {
    const showRes = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderID}`, {
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });

    if (!showRes.ok) {
      const errText = await showRes.text();
      console.error("[PayPal] Show order failed:", errText);
      return res.status(400).json({ error: "Invalid order" });
    }

    orderDetails = await showRes.json();
  } catch (err: any) {
    console.error("[PayPal] Network error:", err.message);
    return res.status(500).json({ error: "Payment service unavailable" });
  }

  // Verify status (should be APPROVED after user clicks approve in SDK)
  if (orderDetails.status !== "APPROVED") {
    // Already captured? PayPal returns COMPLETED — treat as success (idempotent)
    if (orderDetails.status === "COMPLETED") {
      // Order already captured, still upgrade user
    } else {
      return res.status(400).json({
        error: `Order not ready (status: ${orderDetails.status}). Please try again.`,
      });
    }
  }

  // Verify amount & currency
  const pu = orderDetails.purchase_units?.[0];
  const orderValue = pu?.amount?.value;
  const orderCurrency = pu?.amount?.currency_code;

  // PayPal returns amounts as formatted strings with 2 decimals (e.g. "9.00").
  // Compare as numbers to avoid false mismatches ("9.00" !== "9").
  const expectedCents = Math.round(parseFloat(PRO_PRICE) * 100);
  const actualCents = Math.round(parseFloat(orderValue) * 100);

  if (expectedCents !== actualCents) {
    console.error(
      `[PayPal] Amount mismatch: order=${orderValue} (${actualCents}¢), expected=${PRO_PRICE} (${expectedCents}¢)`
    );
    return res.status(400).json({ error: "Payment amount mismatch" });
  }

  if (orderCurrency !== "USD") {
    console.error(`[PayPal] Currency mismatch: ${orderCurrency}`);
    return res.status(400).json({ error: "Payment currency mismatch" });
  }

  // ── Step 2: Capture ──
  if (orderDetails.status !== "COMPLETED") {
    let captureResult: any;
    try {
      const captureRes = await fetch(
        `${paypalBaseUrl}/v2/checkout/orders/${orderID}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: auth,
            "Content-Type": "application/json",
            "PayPal-Request-Id": `capture-${user.id}-${orderID}`,
          },
        }
      );

      if (!captureRes.ok) {
        const errText = await captureRes.text();
        console.error("[PayPal] Capture failed:", errText);

        // Already captured (idempotent)
        if (captureRes.status === 409 || captureRes.status === 422) {
          // Already captured — proceed to upgrade
        } else {
          return res.status(400).json({ error: "Payment capture failed" });
        }
      } else {
        captureResult = await captureRes.json();
        const capStatus =
          captureResult?.purchase_units?.[0]?.payments?.captures?.[0]?.status;
        if (capStatus !== "COMPLETED") {
          console.error("[PayPal] Capture not completed:", capStatus);
          return res.status(400).json({
            error: "Payment not completed",
            status: capStatus,
          });
        }
      }
    } catch (err: any) {
      console.error("[PayPal] Capture error:", err.message);
      return res.status(500).json({ error: "Payment processing error" });
    }
  }

  // ── Step 3: Upgrade user to Pro ──
  const now = new Date();
  const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan: "pro",
        scans_used: 0,
        scans_reset_at: resetAt,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[PayPal] Profile update failed:", updateError);
      // Payment succeeded but DB update failed — return partial success
      return res.status(200).json({
        success: true,
        warning: "Payment received but profile update pending. Please contact support.",
      });
    }
  } catch (err: any) {
    console.error("[PayPal] DB error:", err.message);
    return res.status(500).json({
      success: true,
      warning: "Payment received. Contact support if Pro not activated within 5 min.",
    });
  }

  return res.status(200).json({
    success: true,
    plan: "pro",
    scansResetAt: resetAt,
  });
}
