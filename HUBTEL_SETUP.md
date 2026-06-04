# Hubtel Mobile Money - Setup Guide

The Blue Top Villa booking flow is fully wired for Hubtel mobile money.
It works in "pending" mode now: bookings are created and a payment row is
recorded as pending. As soon as you add the three Hubtel credentials, real
MTN / Telecel(Vodafone) / AirtelTigo prompts fire automatically - no code
changes required.

## 1. Give Hubtel these links

- Website URL: https://blue-top-retreat.lovable.app
- Payment Callback / Webhook URL: https://sgbpuqugkhgcmdsykemp.supabase.co/functions/v1/hubtel-callback

## 2. Insert credentials (placeholders already in the project)

Add these in Lovable Cloud -> Settings -> Secrets using these EXACT names:

- HUBTEL_CLIENT_ID         = Hubtel API Client ID / API Key
- HUBTEL_CLIENT_SECRET     = Hubtel API Client Secret
- HUBTEL_MERCHANT_ACCOUNT  = Hubtel Merchant Account Number / Merchant ID

Secrets are stored encrypted, never committed to the codebase, and never
exposed to the browser - only the backend payment functions can read them.

## 3. That's it

- Functions hubtel-initiate-payment and hubtel-callback read the values at
  runtime via Deno.env.get(...).
- Before the keys exist, the function returns skipped:true and the booking
  stays pending so staff can mark it paid manually in the admin dashboard.
- After the keys exist, customers get a phone prompt; on approval the payment
  is marked successful and the booking paid automatically (synced to the
  Bookings and Payments sections).

## Supported channels

mtn-gh, vodafone-gh (Telecel), airteltigo-gh
