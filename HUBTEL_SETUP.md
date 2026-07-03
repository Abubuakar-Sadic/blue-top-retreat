# Hubtel Mobile Money — Integration Handoff (for the Hubtel team)

Hi Hubtel team — this site is already 100% wired for your mobile money API.
You do **not** need to write any new code. You only need to paste 3
credentials into ONE file. Everything else is done.

---

## What you need from us (already set up)

| Item | Value |
|------|-------|
| Website URL | `https://www.bluetopvilla.com` |
| Payment Callback / Webhook URL | `https://sgbpuqugkhgcmdsykemp.supabase.co/functions/v1/hubtel-callback` |
| Payment API used | Receive Mobile Money (RMP) |
| Supported channels | `mtn-gh`, `vodafone-gh` (Telecel), `airteltigo-gh` |

Please whitelist the callback URL above for transaction status updates.

---

## The ONLY step: paste your 3 credentials

Open this single file in the repository:

```
supabase/functions/hubtel-initiate-payment/index.ts
```

Near the top you will see a clearly marked block. Replace the empty quotes
with the values you issued, then save:

```ts
const HUBTEL = {
  CLIENT_ID: "PASTE_CLIENT_ID_HERE",
  CLIENT_SECRET: "PASTE_CLIENT_SECRET_HERE",
  MERCHANT_ACCOUNT: "PASTE_MERCHANT_ACCOUNT_HERE",
};
```

- `CLIENT_ID` = Hubtel API Client ID / API Key
- `CLIENT_SECRET` = Hubtel API Client Secret
- `MERCHANT_ACCOUNT` = Hubtel Merchant Account Number / Merchant ID

That is the entire integration. Save the file and payments go live.

---

## How it behaves

- **Before** the 3 values are filled in: bookings still work and are saved as
  *pending* so staff can mark them paid manually.
- **After** the 3 values are filled in: customers get a mobile money prompt on
  their phone. When they approve, the booking and payment flip to **paid**
  automatically and show up in the admin dashboard.

---

## Security note (for the site owner)

Pasting the keys directly in the file is the simplest option and is fine for a
private repository. For a public repository, prefer the secure alternative:
leave the three quotes empty and instead store the same values as encrypted
secrets named `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET`, and
`HUBTEL_MERCHANT_ACCOUNT` (Lovable Cloud → Settings → Secrets). The code uses
the pasted values first and falls back to these secrets automatically.
