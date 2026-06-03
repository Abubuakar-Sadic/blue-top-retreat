import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Hubtel posts the final transaction status here once the customer approves
// (or declines) the mobile-money prompt on their phone.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ok = () => new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const payload = await req.json().catch(() => ({}));
    console.log("hubtel-callback payload", JSON.stringify(payload));

    // Hubtel nests details under Data; fall back to top-level keys.
    const data = payload?.Data ?? payload ?? {};
    const clientReference: string | undefined = data.ClientReference ?? payload?.ClientReference;
    const responseCode: string | undefined = payload?.ResponseCode ?? data?.ResponseCode;
    const status: string | undefined = data?.Status ?? payload?.Status;
    const transactionId: string | undefined = data?.TransactionId ?? data?.HubtelTransactionId;

    if (!clientReference) {
      console.error("callback missing ClientReference");
      return ok();
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: payment } = await supabase
      .from("payments").select("id, booking_id, status").eq("transaction_reference", clientReference).maybeSingle();
    if (!payment) {
      console.error("no payment for reference", clientReference);
      return ok();
    }

    const success = responseCode === "0000" || /success|paid|completed/i.test(String(status ?? ""));

    if (success) {
      await supabase.from("payments").update({
        status: "successful",
        paid_at: new Date().toISOString(),
        transaction_reference: transactionId || clientReference,
      }).eq("id", payment.id);

      if (payment.booking_id) {
        // Marks booking paid; the DB trigger keeps booking + payment statuses in sync.
        await supabase.from("bookings").update({ payment_status: "paid" }).eq("id", payment.booking_id);
      }
    } else {
      await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
    }

    return ok();
  } catch (e) {
    console.error("hubtel-callback error", e);
    return ok();
  }
});