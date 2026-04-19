import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pages";
import { PRO_PRICE } from "@/lib/config";

/**
 * POST /api/paypal/create-order
 *
 * Creates a PayPal order for the authenticated user.
 * Amount is read from PRO_PRICE config.
 *
 * Returns: { orderID: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify user is authenticated
  const supabase = createPagesServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Please sign in to upgrade" });
  }

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const paypalBaseUrl = process.env.NEXT_PUBLIC_PAYPAL_API_URL || "https://api-m.paypal.com";

  if (!clientId || !clientSecret) {
    console.error("[PayPal] Missing credentials");
    return res.status(500).json({ error: "Payment not configured" });
  }

  try {
    // Step 1: Get OAuth2 access token
    const tokenRes = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      console.error("[PayPal] Auth failed:", await tokenRes.text());
      return res.status(500).json({ error: "Payment service unavailable" });
    }

    const { access_token } = await tokenRes.json();

    // Step 2: Create order
    const orderRes = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
        "PayPal-Request-Id": `ap-${user.id}-${Date.now()}`, // idempotency key
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: PRO_PRICE,
            },
            description: "AnswerPulse Pro — 30 days access",
          },
        ],
      }),
    });

    if (!orderRes.ok) {
      const errBody = await orderRes.text();
      console.error("[PayPal] Create order failed:", errBody);
      return res.status(500).json({ error: "Failed to create payment order" });
    }

    const orderData = await orderRes.json();

    return res.status(200).json({ orderID: orderData.id });
  } catch (err: any) {
    console.error("[PayPal] Create order error:", err.message);
    return res.status(500).json({ error: "Payment service error" });
  }
}
