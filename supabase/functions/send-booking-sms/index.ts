import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, code, type, name, room, event } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'phone and code required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!TWILIO_API_KEY || !TWILIO_FROM || !LOVABLE_API_KEY) {
      console.log('SMS skipped — Twilio not configured. Code:', code, 'phone:', phone);
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'twilio_not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize Ghana local numbers to E.164 (+233...)
    let to = String(phone).replace(/[\s-]/g, '');
    if (to.startsWith('0')) to = '+233' + to.slice(1);
    else if (!to.startsWith('+')) to = '+' + to;

    const subject = type === 'venue'
      ? `venue booking for "${event ?? ''}"`
      : type === 'event'
        ? `event "${event ?? ''}"`
        : `room "${room ?? ''}"`;
    const body = `Hi ${name ?? 'there'}, your Blue Top Villa ${subject} booking is received. Code: ${code}. Keep this for check-in. Call 059 554 3157 for help.`;

    const res = await fetch('https://connector-gateway.lovable.dev/twilio/Messages.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Twilio error', res.status, data);
      return new Response(JSON.stringify({ ok: false, error: data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true, sid: data.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-booking-sms error', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});