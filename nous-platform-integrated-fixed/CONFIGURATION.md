# NOUS runtime configuration

1. Set the public Supabase project URL and anon/publishable key in `js/supabase-config.js`. Never place a service-role key in browser code.
2. Set Edge Function secrets: `OPENAI_API_KEY`, optional `OPENAI_MODEL`, `YOCO_SECRET_KEY`, and the Supabase-provided runtime secrets.
3. Deploy: `supabase functions deploy orule`, `supabase functions deploy nous-companion`, `supabase functions deploy yoco-checkout`, and `supabase functions deploy yoco-webhook`.
4. Apply migrations with `supabase db push` after reviewing the target project.
