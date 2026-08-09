# NOUS membership + Yoco deployment

## 1. Apply the database migration

```bash
npx supabase link --project-ref ixnncxwrztxluiltmsol
npx supabase db push
```

## 2. Store the Yoco live key securely

Never place the live secret key in HTML, JavaScript, `.env` committed to Git, screenshots, or chat messages.

```bash
npx supabase secrets set YOCO_SECRET_KEY='sk_live_your_key_here'
npx supabase secrets set YOCO_WEBHOOK_SECRET='your_webhook_secret_here'
```

## 3. Deploy the functions

```bash
npx supabase functions deploy yoco-checkout
npx supabase functions deploy yoco-webhook --no-verify-jwt
```

## 4. Configure Yoco

Set the Yoco webhook URL to:

```text
https://ixnncxwrztxluiltmsol.supabase.co/functions/v1/yoco-webhook
```

Before accepting real customers, replace the guarded placeholder in `yoco-webhook/index.ts` with Yoco's current official signature-verification procedure. The function intentionally refuses to activate a membership when `YOCO_WEBHOOK_SECRET` is absent.

## 5. Important billing limitation

This implementation creates a secure Yoco checkout and activates one month of membership after a verified successful-payment webhook. It does not silently claim recurring debit-order/subscription support. Automated renewal requires Yoco's current recurring-payment product/API or a renewal checkout flow.
