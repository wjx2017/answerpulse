import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * Lemon Squeezy webhook handler.
 * Handles subscription_created, subscription_updated, subscription_cancelled events.
 *
 * Events:
 * - subscription_created: New Pro subscription → set plan = 'pro'
 * - subscription_updated: Plan change / renewal
 * - subscription_cancelled: Subscription cancelled → set plan = 'free'
 * - subscription_expired: Subscription expired → set plan = 'free'
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[LemonSqueezy] WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // Verify webhook signature
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const signature = req.headers["x-signature"] as string;

  if (signature) {
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const digest = hmac.update(rawBody).digest("hex");
    if (signature !== digest) {
      console.error("[LemonSqueezy] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  let body: any;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const eventName = body.meta?.event_name;
  const userId = body.meta?.custom_data?.user_id;

  if (!eventName) {
    return res.status(200).json({ received: true });
  }

  console.log(`[LemonSqueezy] Event: ${eventName}, userId: ${userId}`);

  if (!userId) {
    console.error("[LemonSqueezy] No user_id in webhook payload");
    return res.status(400).json({ error: "Missing user_id" });
  }

  // Create Supabase admin client (service role)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_resumed":
        // Upgrade to Pro
        await supabase
          .from("profiles")
          .update({
            plan: "pro",
            scans_used: 0,
            scans_reset_at: new Date().toISOString(),
          })
          .eq("id", userId);
        console.log(`[LemonSqueezy] User ${userId} upgraded to Pro`);
        break;

      case "subscription_updated":
        // Check if renewal or downgrade
        const status = body.data?.attributes?.status;
        if (status === "active" || status === "past_due") {
          await supabase
            .from("profiles")
            .update({ plan: "pro" })
            .eq("id", userId);
        }
        break;

      case "subscription_cancelled":
        // Keep Pro until end of billing period
        const cancelledAt = body.data?.attributes?.cancelled_at;
        const endsAt = body.data?.attributes?.ends_at;
        if (endsAt && new Date(endsAt) <= new Date()) {
          await supabase
            .from("profiles")
            .update({ plan: "free" })
            .eq("id", userId);
          console.log(`[LemonSqueezy] User ${userId} downgraded to Free`);
        } else if (!endsAt) {
          // Cancelled but still active until billing period ends
          console.log(`[LemonSqueezy] User ${userId} cancelled, active until ${endsAt}`);
        }
        break;

      case "subscription_expired":
        // Subscription has fully expired
        await supabase
          .from("profiles")
          .update({ plan: "free" })
          .eq("id", userId);
        console.log(`[LemonSqueezy] User ${userId} subscription expired, downgraded to Free`);
        break;

      default:
        console.log(`[LemonSqueezy] Unhandled event: ${eventName}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("[LemonSqueezy] Error processing webhook:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};
