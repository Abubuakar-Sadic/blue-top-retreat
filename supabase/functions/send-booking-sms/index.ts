import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

type SmsType = 'room' | 'event' | 'venue';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { type, id } = await req.json();
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(id) ||
        (type !== 'room' && type !== 'event' && type !== 'venue')) {
      return new Response(JSON.stringify({ error: 'valid type and record id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up the real record server-side so SMS can ONLY be sent to a phone
    // number that already exists on a genuine booking — never an arbitrary
    // number supplied by the caller. This prevents anonymous SMS spam abuse.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let phone: string | null = null;
    let code: string | null = null;
    let name = 'there';
    let room: string | undefined;
    let event: string | undefined;

    if (type === 'room') {
      const { data } = await admin.from('bookings')
        .select('customer_phone, booking_code, customer_name, room_id').eq('id', id).maybeSingle();
      if (data) {
        phone = data.customer_phone; code = data.booking_code; name = data.customer_name || name;
        if (data.room_id) {
          const { data: r } = await admin.from('rooms').select('room_name').eq('id', data.room_id).maybeSingle();
          room = r?.room_name;
        }
      }
    } else if (type === 'event') {
      const { data } = await admin.from('event_reservations')
        .select('attendee_phone, reservation_code, attendee_name, event_title').eq('id', id).maybeSingle();
      if (data) { phone = data.attendee_phone; code = data.reservation_code; name = data.attendee_name || name; event = data.event_title ?? undefined; }
    } else {
      const { data } = await admin.from('venue_reservations')
        .select('customer_phone, reservation_code, customer_name, event_type').eq('id', id).maybeSingle();
      if (data) { phone = data.customer_phone; code = data.reservation_code; name = data.customer_name || name; event = data.event_type ?? undefined; }
    }

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    const body = `Hi ${name ?? 'there'}, your Blue Top Villa ${subject} booking is received. Code: ${code}. Keep this for check-in. Call 055 917 1787 or 059 415 7608 for help.`;

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