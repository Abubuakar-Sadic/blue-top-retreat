import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Permanently delete a user account. Only a CEO may call this. Deleting the
// auth user cascades to the profile and role rows, so the person can no longer
// sign in or reuse the account until they submit a brand-new sign-up.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Identify the caller from their JWT.
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: 'Invalid session' }, 401);
    const callerId = userData.user.id;

    // Server-side authorization: the caller must hold a ceo/admin role.
    const { data: isCeo } = await admin.rpc('is_ceo', { _uid: callerId });
    if (!isCeo) return json({ error: 'Only a CEO can delete accounts.' }, 403);

    const { user_id } = await req.json();
    if (!user_id || typeof user_id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(user_id)) {
      return json({ error: 'Valid user_id is required.' }, 400);
    }
    if (user_id === callerId) return json({ error: 'You cannot delete your own account.' }, 400);

    // Never allow deleting a permanent CEO account.
    const { data: isProtected } = await admin.rpc('is_protected_ceo', { _uid: user_id });
    if (isProtected) return json({ error: 'This CEO account is permanent and cannot be deleted.' }, 403);

    const { error: delErr } = await admin.auth.admin.deleteUser(user_id);
    if (delErr) return json({ error: delErr.message }, 400);

    return json({ ok: true });
  } catch (e) {
    console.error('delete-user error', e);
    return json({ error: String(e) }, 500);
  }
});
