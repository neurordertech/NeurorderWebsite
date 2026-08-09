(() => {
  "use strict";

  const url =
    "https://ixnncxwrztxluiltmsol.supabase.co";

  const publishableKey =
    "sb_publishable_yQAdi3Qw64oPQoz6nNGr9Q_sTLA9U_o";

  window.NOUS_SUPABASE_CONFIG = Object.freeze({
    url,
    publishableKey
  });

  const hasRealConfiguration =
    /^https:\/\/.+\.supabase\.co$/i.test(url) &&
    typeof publishableKey === "string" &&
    publishableKey.length > 20 &&
    !publishableKey.startsWith("PASTE_");

  window.NOUS_CONFIG_READY = hasRealConfiguration;

  if (!hasRealConfiguration) {
    console.error(
      "[NOUS] Supabase project URL or publishable key is missing."
    );
    return;
  }

  if (!window.supabase?.createClient) {
    console.error(
      "[NOUS] Supabase JS must load before supabase-config.js."
    );
    return;
  }

  if (!window.NOUS_SUPABASE) {
    window.NOUS_SUPABASE =
      window.supabase.createClient(
        url,
        publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
  }

  console.info(
    "[NOUS] Supabase client initialised."
  );
})();