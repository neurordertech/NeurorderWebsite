const SUPABASE_URL =
  "https://ixnncxwrztxluiltmsol.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_yQAdi3Qw64oPQoz6nNGr9Q_sTLA9U_o";

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {
  throw new Error(
    "The Supabase JavaScript library was not loaded.",
  );
}

window.supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

window.neurorderSupabase =
  window.supabaseClient;

console.log(
  "Supabase client connected:",
  SUPABASE_URL,
);