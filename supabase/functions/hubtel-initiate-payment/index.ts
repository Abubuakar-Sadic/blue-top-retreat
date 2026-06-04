import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

/* ===========================================================================
 *  ███  HUBTEL TEAM: PASTE YOUR 3 CREDENTIALS BELOW  ███
 * ---------------------------------------------------------------------------
 *  This is the ONLY place you need to edit to turn payments on.
 *  Replace the empty quotes "" with the values Hubtel issued, then save.
 *  Example:  CLIENT_ID = "abc123xyz"
 *
 *  Site URL     : https://blue-top-retreat.lovable.app
 *  Callback URL : https://sgbpuqugkhgcmdsykemp.supabase.co/functions/v1/hubtel-callback
 * ========================================================================= */
const HUBTEL = {
  CLIENT_ID: "",        // <-- Hubtel API Client ID / API Key
  CLIENT_SECRET: "",    // <-- Hubtel API Client Secret
  MERCHANT_ACCOUNT: "", // <-- Hubtel Merchant Account Number / Merchant ID
};
/* =========================================================================
 *  (Optional/advanced) If left blank above, the values are read from secure
 *  environment secrets instead — no need to touch this.
 * ========================================================================= */

// Normalize a Ghana mobile number to 233XXXXXXXXX (no plus, as Hubtel expects)
const normalizeMsisdn = (raw: string): string => {
  let n = String(raw).replace(/[\s-]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  if (n.startsWith("0")) n = "233" + n.slice(1);
  if (!n.startsWith("233")) n = "233" + n;
  return n;
};

const CHANNELS = ["mtn-gh", "vodafone-gh", "airteltigo-gh"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json().catch(() => ({}));
    const { bookingId, amount, customerName, customerMsisdn, channel, customerEmail, description, token } = body ?? {};

    // Validate input
    if (!bookingId || typeof bookingId !== "string")
      return json({ ok: false, error: "bookingId is required" }, 400);
    const amt = Number(amount);
    if (!amt || amt <= 0) return json({ ok: false, error: "A valid amount is required" }, 400);
    if (!customerMsisdn) return json({ ok: false, error: "customerMsisdn is required" }, 400);
    if (!channel || !CHANNELS.includes(channel))
      return json({ ok: false, error: `channel must be one of ${CHANNELS.join(", ")}` }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify booking exists & get its amount as source of truth
    const { data: booking, error: bErr } = await supabase
      .from("bookings").select("id, total_amount, customer_name").eq("id", bookingId).maybeSingle();
    if (bErr || !booking) return json({ ok: false, error: "Booking not found" }, 404);

    const chargeAmount = Number(booking.total_amount ?? amt) || amt;
    const clientReference = `BTV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

    // Record a pending payment linked to the booking
    const { error: payErr } = await supabase.from("payments").insert({
      booking_id: bookingId,
      amount: chargeAmount,
      status: "pending",
      payment_method: `momo:${channel}`,
      transaction_reference: clientReference,
    });
    if (payErr) console.error("payment insert error", payErr.message);

    const CLIENT_ID = HUBTEL.CLIENT_ID || Deno.env.get("HUBTEL_CLIENT_ID");
    const CLIENT_SECRET = HUBTEL.CLIENT_SECRET || Deno.env.get("HUBTEL_CLIENT_SECRET");
    const MERCHANT = HUBTEL.MERCHANT_ACCOUNT || Deno.env.get("HUBTEL_MERCHANT_ACCOUNT");

    // Graceful fallback so booking flow still works before Hubtel keys are added
    if (!CLIENT_ID || !CLIENT_SECRET || !MERCHANT) {
      console.log("Hubtel not configured — payment left pending.", { clientReference, bookingId });
      return json({ ok: true, skipped: true, reason: "hubtel_not_configured", clientReference });
    }

    const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const callbackUrl = `${SUPABASE_URL}/functions/v1/hubtel-callback`;

    const hubtelRes = await fetch(
      `https://rmp.hubtel.com/merchantaccount/merchants/${MERCHANT}/receive/mobilemoney`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          CustomerName: customerName || booking.customer_name || "Customer",
          CustomerMsisdn: normalizeMsisdn(customerMsisdn),
          CustomerEmail: customerEmail || undefined,
          Channel: channel,
          Amount: chargeAmount,
          PrimaryCallbackUrl: callbackUrl,
          Description: description || "Blue Top Villa booking",
          ClientReference: clientReference,
          Token: token || undefined,
        }),
      },
    );

    const data = await hubtelRes.json().catch(() => ({}));
    if (!hubtelRes.ok) {
      console.error("Hubtel error", hubtelRes.status, data);
      await supabase.from("payments").update({ status: "failed" }).eq("transaction_reference", clientReference);
      return json({ ok: false, error: data?.Message || "Payment request failed", details: data });
    }

    return json({ ok: true, clientReference, hubtel: data });
  } catch (e) {
    console.error("hubtel-initiate-payment error", e);
    return json({ ok: false, error: String(e) });
  }
});